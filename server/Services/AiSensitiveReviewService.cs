using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Services;

public sealed record AiSensitiveReviewResult(
    bool ShouldBlock,
    string? SuggestedWord,
    string Category,
    string MatchMode,
    string HandleMode,
    string? ReplaceText,
    int Severity,
    int Priority,
    string? Reason,
    decimal? Confidence,
    string? RawResponse);

public sealed class AiSensitiveReviewService(
    AppDbContext db,
    IHttpClientFactory httpClientFactory,
    ILogger<AiSensitiveReviewService> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<AiSensitiveReviewResult> ReviewAsync(string content, string scope, CancellationToken cancellationToken = default)
    {
        var normalizedContent = NormalizeText(content, 200);
        var normalizedScope = NormalizeText(scope, 50).ToUpperInvariant();

        if (string.IsNullOrWhiteSpace(normalizedContent) || string.IsNullOrWhiteSpace(normalizedScope))
        {
            return SafeResult();
        }

        var config = await db.AiVoteSuggestionConfigs
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == 1, cancellationToken);

        if (!CanCallRemote(config))
        {
            return SafeResult();
        }

        try
        {
            return await ReviewByRemoteAsync(config!, normalizedContent, normalizedScope, cancellationToken);
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning("AI sensitive review request timed out.");
            return SafeResult();
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning(ex, "AI sensitive review request is unreachable.");
            return SafeResult();
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "AI sensitive review failed.");
            return SafeResult();
        }
    }

    private async Task<AiSensitiveReviewResult> ReviewByRemoteAsync(
        AiVoteSuggestionConfig config,
        string content,
        string scope,
        CancellationToken cancellationToken)
    {
        var url = $"{config.BaseUrl.TrimEnd('/')}/chat/completions";
        var timeoutSeconds = Math.Clamp(config.TimeoutSeconds, 5, 60);

        using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        cts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

        var payload = new
        {
            model = config.Model,
            temperature = 0.1,
            max_tokens = Math.Clamp(config.MaxTokens, 128, 512),
            messages = new object[]
            {
                new { role = "system", content = BuildSystemPrompt() },
                new { role = "user", content = BuildUserPrompt(content, scope) }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config.ApiKey?.Trim());
        request.Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json");

        var httpClient = httpClientFactory.CreateClient(nameof(AiSensitiveReviewService));
        using var response = await httpClient.SendAsync(request, cts.Token);
        var rawResponse = await response.Content.ReadAsStringAsync(cts.Token);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"AI request failed: {(int)response.StatusCode} {response.ReasonPhrase}");
        }

        var contentText = ExtractAssistantContent(rawResponse);
        return ParseReviewResult(contentText, content, scope, rawResponse);
    }

    private static AiSensitiveReviewResult ParseReviewResult(string contentText, string originalContent, string scope, string rawResponse)
    {
        var json = ExtractJsonObject(contentText);
        if (string.IsNullOrWhiteSpace(json))
        {
            return SafeResult();
        }

        try
        {
            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            var isSensitive = root.TryGetProperty("isSensitive", out var sensitiveElement) &&
                              sensitiveElement.ValueKind is JsonValueKind.True or JsonValueKind.False &&
                              sensitiveElement.GetBoolean();

            if (!isSensitive)
            {
                return SafeResult(rawResponse);
            }

            var suggestedWord = NormalizeNullableText(
                root.TryGetProperty("suggestedWord", out var wordElement) ? wordElement.GetString() : null,
                100);

            if (string.IsNullOrWhiteSpace(suggestedWord))
            {
                return SafeResult(rawResponse);
            }

            if (!ContainsIgnoreCase(originalContent, suggestedWord))
            {
                return SafeResult(rawResponse);
            }

            var category = NormalizeCategory(root.TryGetProperty("category", out var categoryElement)
                ? categoryElement.GetString()
                : null);

            var reason = NormalizeNullableText(root.TryGetProperty("reason", out var reasonElement)
                ? reasonElement.GetString()
                : null, 500);

            decimal? confidence = null;
            if (root.TryGetProperty("confidence", out var confidenceElement) && confidenceElement.ValueKind == JsonValueKind.Number)
            {
                confidence = Math.Clamp(confidenceElement.GetDecimal(), 0m, 1m);
            }

            var severity = category switch
            {
                "ABUSE" => 7,
                "ADS" => 6,
                "CONTACT" => 8,
                _ => 4
            };

            return new AiSensitiveReviewResult(
                true,
                suggestedWord,
                category,
                "CONTAINS",
                "BLOCK",
                null,
                severity,
                120,
                reason ?? $"AI detected a suspicious term for {scope}.",
                confidence,
                TrimToLength(rawResponse, 4000));
        }
        catch
        {
            return SafeResult(rawResponse);
        }
    }

    private static bool CanCallRemote(AiVoteSuggestionConfig? config)
    {
        if (config is null) return false;
        if (string.IsNullOrWhiteSpace(config.BaseUrl)) return false;
        if (string.IsNullOrWhiteSpace(config.Model)) return false;
        return !string.IsNullOrWhiteSpace(config.ApiKey);
    }

    private static string BuildSystemPrompt()
    {
        return
            "You are a content moderation assistant for a campus anonymous message app. " +
            "Analyze the input and decide whether it contains a likely sensitive term that should be blocked and reviewed by admins. " +
            "Return JSON only in this format: " +
            "{\"isSensitive\":true,\"suggestedWord\":\"...\",\"category\":\"GENERAL|ABUSE|ADS|CONTACT\",\"reason\":\"...\",\"confidence\":0.0}. " +
            "Rules: suggestedWord must be an actual short term from the input text, no more than 20 characters. " +
            "If the text is safe, return {\"isSensitive\":false,\"suggestedWord\":\"\",\"category\":\"GENERAL\",\"reason\":\"\",\"confidence\":0}.";
    }

    private static string BuildUserPrompt(string content, string scope)
    {
        return
            $"Scope: {scope}\n" +
            $"Content: {content}\n" +
            "Check whether the content contains a likely sensitive term that is not suitable for direct publishing.";
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

    private static string? ExtractJsonObject(string text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');

        if (start < 0 || end <= start)
        {
            return null;
        }

        return text[start..(end + 1)];
    }

    private static string NormalizeCategory(string? category)
    {
        var normalized = NormalizeText(category, 30).ToUpperInvariant();
        return normalized switch
        {
            "ABUSE" => "ABUSE",
            "ADS" => "ADS",
            "CONTACT" => "CONTACT",
            _ => "GENERAL"
        };
    }

    private static string NormalizeText(string? value, int maxLength)
    {
        var normalized = (value ?? string.Empty).Trim();
        if (normalized.Length <= maxLength) return normalized;
        return normalized[..maxLength];
    }

    private static string? NormalizeNullableText(string? value, int maxLength)
    {
        var normalized = NormalizeText(value, maxLength);
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static bool ContainsIgnoreCase(string source, string value)
    {
        return source.Contains(value, StringComparison.OrdinalIgnoreCase);
    }

    private static string? TrimToLength(string? value, int maxLength)
    {
        var normalized = NormalizeNullableText(value, maxLength);
        if (string.IsNullOrWhiteSpace(normalized)) return null;
        return normalized;
    }

    private static AiSensitiveReviewResult SafeResult(string? rawResponse = null)
    {
        return new AiSensitiveReviewResult(
            false,
            null,
            "GENERAL",
            "CONTAINS",
            "BLOCK",
            null,
            4,
            120,
            null,
            null,
            TrimToLength(rawResponse, 4000));
    }
}
