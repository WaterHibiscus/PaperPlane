using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using server.Models;

namespace server.Services;

public sealed class AiVoteSuggestionService(IHttpClientFactory httpClientFactory, ILogger<AiVoteSuggestionService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<AiVoteSuggestionResult> GenerateAsync(
        AiVoteSuggestionConfig config,
        string content,
        string mood,
        string locationTag,
        int optionCount,
        CancellationToken cancellationToken)
    {
        var normalizedContent = NormalizeText(content, 200);
        var normalizedMood = NormalizeText(mood, 20);
        var normalizedLocation = NormalizeText(locationTag, 50);
        var safeOptionCount = Math.Clamp(optionCount, 2, 4);

        var fallbackReason = "unknown";

        if (CanCallRemote(config))
        {
            try
            {
                var remoteResult = await GenerateByRemoteAsync(
                    config,
                    normalizedContent,
                    normalizedMood,
                    normalizedLocation,
                    safeOptionCount,
                    cancellationToken);

                if (string.Equals(remoteResult.Source, "ai", StringComparison.OrdinalIgnoreCase) &&
                    remoteResult.Options.Count >= 2)
                {
                    return remoteResult with { Source = "ai", SourceDetail = null };
                }

                fallbackReason = NormalizeText(remoteResult.SourceDetail, 200);
                if (string.IsNullOrWhiteSpace(fallbackReason))
                {
                    fallbackReason = "remote_result_invalid";
                }

                if (remoteResult.Options.Count >= 2 && config.EnableFallback)
                {
                    return remoteResult with
                    {
                        Source = "fallback",
                        SourceDetail = fallbackReason
                    };
                }

                logger.LogWarning("AI vote suggestion fallback due to reason: {Reason}", fallbackReason);
            }
            catch (OperationCanceledException)
            {
                logger.LogWarning("AI vote suggestion remote request timeout.");
                fallbackReason = "remote_timeout";
            }
            catch (HttpRequestException ex)
            {
                logger.LogWarning(ex, "AI vote suggestion remote request is unreachable.");
                fallbackReason = $"remote_unreachable:{NormalizeText(ex.Message, 160)}";
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "AI vote suggestion remote call failed.");
                fallbackReason = $"remote_error:{NormalizeText(ex.Message, 180)}";
            }
        }
        else
        {
            fallbackReason = "ai_disabled_or_missing_config";
        }

        if (!config.EnableFallback)
        {
            throw new InvalidOperationException("AI is disabled or missing configuration.");
        }

        var fallback = BuildFallbackSuggestion(normalizedContent, normalizedMood, normalizedLocation, safeOptionCount);
        return new AiVoteSuggestionResult(fallback.Title, fallback.Options, "fallback", null, fallbackReason);
    }

    private async Task<AiVoteSuggestionResult> GenerateByRemoteAsync(
        AiVoteSuggestionConfig config,
        string content,
        string mood,
        string locationTag,
        int optionCount,
        CancellationToken cancellationToken)
    {
        var url = $"{config.BaseUrl.TrimEnd('/')}/chat/completions";
        var timeoutSeconds = Math.Clamp(config.TimeoutSeconds, 5, 60);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

        var requestNonce = Guid.NewGuid().ToString("N")[..8];
        var userPrompt = BuildUserPrompt(content, mood, locationTag, optionCount, requestNonce);
        var payload = new
        {
            model = config.Model,
            temperature = (double)Math.Clamp(config.Temperature, 0m, 2m),
            max_tokens = Math.Clamp(config.MaxTokens, 64, 1024),
            messages = new object[]
            {
                new { role = "system", content = BuildSystemPrompt(config.SystemPrompt) },
                new { role = "user", content = userPrompt }
            }
        };

        var requestJson = JsonSerializer.Serialize(payload, JsonOptions);
        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.ApiKey?.Trim());
        request.Content = new StringContent(requestJson, Encoding.UTF8, "application/json");

        var httpClient = httpClientFactory.CreateClient(nameof(AiVoteSuggestionService));
        using var response = await httpClient.SendAsync(request, cts.Token);
        var rawResponse = await response.Content.ReadAsStringAsync(cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"AI request failed: {(int)response.StatusCode} {response.ReasonPhrase}");
        }

        var contentText = ExtractAssistantContent(rawResponse);
        var parsed = ParseSuggestionPayload(contentText, optionCount, content, mood, locationTag);

        var source = parsed.IsFallback ? "fallback" : "ai";
        var sourceDetail = parsed.IsFallback ? "ai_response_parse_failed" : null;

        return new AiVoteSuggestionResult(
            parsed.Title,
            parsed.Options,
            source,
            TrimToLength(rawResponse, 4000),
            sourceDetail);
    }

    private static bool CanCallRemote(AiVoteSuggestionConfig config)
    {
        if (!config.IsEnabled) return false;
        if (string.IsNullOrWhiteSpace(config.BaseUrl)) return false;
        if (string.IsNullOrWhiteSpace(config.Model)) return false;
        return !string.IsNullOrWhiteSpace(config.ApiKey);
    }

    private static string BuildSystemPrompt(string prompt)
    {
        var defaultPrompt =
            "You are a poll assistant. Return JSON only in this format: {\"title\":\"...\",\"options\":[\"...\",\"...\"]}. " +
            "Do not reference any previous conversation, previous input, or prior output. Use only current request.";
        var normalized = NormalizeText(prompt, 4000);
        if (string.IsNullOrWhiteSpace(normalized))
        {
            return defaultPrompt;
        }

        return
            $"{normalized}\n" +
            "Additional hard rule: do not reference any previous conversation or previous result. Only use current request.";
    }

    private static string BuildUserPrompt(string content, string mood, string locationTag, int optionCount, string requestNonce)
    {
        return
            $"Content: {content}\n" +
            $"Mood: {mood}\n" +
            $"Location: {locationTag}\n" +
            $"RequestNonce: {requestNonce}\n" +
            $"Generate one poll title and {optionCount} options.\n" +
            "Rules: title <= 60 chars; each option <= 20 chars; avoid unsafe content; JSON only.";
    }

    private static string ExtractAssistantContent(string responseJson)
    {
        using var doc = JsonDocument.Parse(responseJson);
        var root = doc.RootElement;
        var choices = root.GetProperty("choices");
        if (choices.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("AI response has no choices.");
        }

        var message = choices[0].GetProperty("message");
        if (!message.TryGetProperty("content", out var contentElement))
        {
            throw new InvalidOperationException("AI response missing content.");
        }

        var content = contentElement.GetString() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new InvalidOperationException("AI response content is empty.");
        }

        return content;
    }

    private static ParsedSuggestion ParseSuggestionPayload(
        string contentText,
        int optionCount,
        string fallbackContent,
        string fallbackMood,
        string fallbackLocation)
    {
        var json = ExtractJsonObject(contentText);
        if (!string.IsNullOrWhiteSpace(json))
        {
            try
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                var rawTitle = root.TryGetProperty("title", out var titleElement) ? titleElement.GetString() : string.Empty;
                var title = NormalizeTitle(rawTitle, fallbackContent, fallbackMood, fallbackLocation);
                var options = root.TryGetProperty("options", out var optionsElement)
                    ? NormalizeOptions(optionsElement, optionCount)
                    : [];

                if (options.Count >= 2)
                {
                    return new ParsedSuggestion(title, options, false);
                }
            }
            catch
            {
                // fallback below
            }
        }

        var fallback = BuildFallbackSuggestion(fallbackContent, fallbackMood, fallbackLocation, optionCount);
        return new ParsedSuggestion(fallback.Title, fallback.Options, true);
    }

    private static string ExtractJsonObject(string source)
    {
        if (string.IsNullOrWhiteSpace(source)) return string.Empty;

        var trimmed = source.Trim();
        if (trimmed.StartsWith("```"))
        {
            trimmed = Regex.Replace(trimmed, "^```[a-zA-Z]*\\s*", string.Empty);
            trimmed = Regex.Replace(trimmed, "\\s*```$", string.Empty);
        }

        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');
        if (start >= 0 && end > start)
        {
            return trimmed[start..(end + 1)];
        }

        return string.Empty;
    }

    private static string NormalizeTitle(string? title, string content, string mood, string locationTag)
    {
        var normalized = NormalizeText(title, 60);
        if (!string.IsNullOrWhiteSpace(normalized)) return normalized;

        var fallback = BuildFallbackSuggestion(content, mood, locationTag, 3);
        return fallback.Title;
    }

    private static List<string> NormalizeOptions(JsonElement element, int optionCount)
    {
        if (element.ValueKind != JsonValueKind.Array) return [];

        var options = element.EnumerateArray()
            .Select(item => item.ValueKind == JsonValueKind.String ? item.GetString() : item.ToString())
            .Select(item => NormalizeText(item, 20))
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.Ordinal)
            .Take(4)
            .ToList();

        if (options.Count >= 2) return options.Take(Math.Clamp(optionCount, 2, 4)).ToList();
        return [];
    }

    private static ParsedSuggestion BuildFallbackSuggestion(string content, string mood, string locationTag, int optionCount)
    {
        var cleanContent = NormalizeText(content, 200);
        var cleanMood = NormalizeText(mood, 20);
        var cleanLocation = NormalizeText(locationTag, 50);
        var safeCount = Math.Clamp(optionCount, 2, 4);

        var titleSeed = TrimToLength(cleanContent, 20);
        var titleCandidates = BuildFallbackTitleCandidates(titleSeed, cleanLocation);
        var title = NormalizeText(PickRandom(titleCandidates), 60);

        var optionCandidates = BuildFallbackOptionCandidates(cleanMood);
        var options = PickRandom(optionCandidates).Take(safeCount).ToList();

        return new ParsedSuggestion(title, options, true);
    }

    private static List<string> BuildFallbackTitleCandidates(string titleSeed, string locationTag)
    {
        var candidates = new List<string>();
        if (!string.IsNullOrWhiteSpace(titleSeed))
        {
            candidates.Add($"{titleSeed}，你怎么看？");
            candidates.Add($"关于“{titleSeed}”，你会怎么选？");
            candidates.Add($"{titleSeed}这件事，你更偏向哪边？");
            candidates.Add($"如果是你，面对“{titleSeed}”会怎么做？");
        }
        else if (!string.IsNullOrWhiteSpace(locationTag))
        {
            candidates.Add($"{locationTag}这件事，你怎么看？");
            candidates.Add($"在{locationTag}遇到这种情况，你会选哪一个？");
            candidates.Add($"{locationTag}这个话题，你更认同哪种观点？");
        }
        else
        {
            candidates.Add("这件事你怎么看？");
            candidates.Add("如果是你，会怎么选？");
            candidates.Add("你更认同哪一种观点？");
        }

        return candidates;
    }

    private static List<List<string>> BuildFallbackOptionCandidates(string mood)
    {
        var optionSets = new List<List<string>>
        {
            new() { "支持", "不支持", "看情况", "再观察" },
            new() { "赞成", "反对", "中立", "不了解" },
            new() { "我认同", "不太认同", "需要更多信息", "保持中立" },
            new() { "可以试试", "暂不建议", "分情况", "说不准" }
        };

        if (mood.Contains("happy", StringComparison.OrdinalIgnoreCase) ||
            mood.Contains("开心", StringComparison.OrdinalIgnoreCase))
        {
            optionSets.Add(new List<string> { "很认同", "一般认同", "不太认同", "再看看" });
            optionSets.Add(new List<string> { "支持冲一把", "稳一点再说", "看具体情况", "先观望" });
        }
        else if (mood.Contains("sad", StringComparison.OrdinalIgnoreCase) ||
                 mood.Contains("难过", StringComparison.OrdinalIgnoreCase))
        {
            optionSets.Add(new List<string> { "能共情", "有点共情", "不太共情", "再聊聊" });
            optionSets.Add(new List<string> { "先抱抱自己", "找人聊聊", "先静一静", "再想想" });
        }

        return optionSets;
    }

    private static T PickRandom<T>(IReadOnlyList<T> list)
    {
        if (list.Count == 0) throw new InvalidOperationException("List is empty.");
        return list[Random.Shared.Next(list.Count)];
    }

    private static string NormalizeText(string? value, int maxLength)
    {
        var normalized = (value ?? string.Empty).Trim();
        normalized = Regex.Replace(normalized, "\\s+", " ");
        return TrimToLength(normalized, maxLength);
    }

    private static string TrimToLength(string value, int maxLength)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;
        if (maxLength <= 0) return string.Empty;
        return value.Length <= maxLength ? value : value[..maxLength];
    }

    private sealed record ParsedSuggestion(string Title, List<string> Options, bool IsFallback);
}

public sealed record AiVoteSuggestionResult(
    string Title,
    List<string> Options,
    string Source,
    string? RawResponse,
    string? SourceDetail = null);
