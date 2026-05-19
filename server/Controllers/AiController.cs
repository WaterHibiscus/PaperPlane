using System.Diagnostics;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/ai")]
public class AiController(
    AppDbContext db,
    AiVoteSuggestionService aiVoteSuggestionService) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    [HttpPost("vote-suggestion")]
    public async Task<ActionResult<VoteSuggestionResponse>> GenerateVoteSuggestion(
        [FromBody] GenerateVoteSuggestionRequest request,
        CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var requestId = Guid.NewGuid();
        var timer = Stopwatch.StartNew();

        var content = NormalizeText(request.Content, 200);
        var mood = NormalizeText(request.Mood, 20);
        var locationTag = NormalizeText(request.LocationTag, 50);
        var optionCount = Math.Clamp(request.OptionCount, 2, 4);
        var appUserId = GetCurrentAppUserIdOrNull();

        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(new { message = "请输入内容后再生成投票建议" });

        var config = await GetOrCreateConfigAsync(cancellationToken);
        if (!config.IsEnabled && !config.EnableFallback)
            return StatusCode(503, new { message = "AI投票建议功能暂未启用" });

        if (appUserId.HasValue && config.PerUserMinuteLimit > 0)
        {
            var since = now.AddMinutes(-1);
            var requestCount = await db.AiVoteSuggestionLogs
                .CountAsync(
                    log => log.AppUserId == appUserId && log.CreateTime >= since,
                    cancellationToken);
            if (requestCount >= config.PerUserMinuteLimit)
                return StatusCode(429, new { message = "请求过于频繁，请稍后再试" });
        }

        var source = "fallback";
        var status = "failed";
        string? errorMessage = null;
        string? sourceDetail = null;
        string? rawResponse = null;
        string? generatedTitle = null;
        List<string> generatedOptions = [];

        try
        {
            var result = await aiVoteSuggestionService.GenerateAsync(
                config,
                content,
                mood,
                locationTag,
                optionCount,
                cancellationToken);

            generatedTitle = NormalizeText(result.Title, 60);
            generatedOptions = NormalizeVoteOptions(result.Options, optionCount);
            source = NormalizeText(result.Source, 20);
            sourceDetail = NormalizeNullableText(result.SourceDetail, 500);
            rawResponse = NormalizeNullableText(result.RawResponse, 4000);
            status = "success";

            if (generatedOptions.Count < 2)
            {
                status = "failed";
                errorMessage = "生成的选项不足两个";
                return StatusCode(502, new { message = "AI返回内容无效，请重试" });
            }

            return new VoteSuggestionResponse(requestId, generatedTitle, generatedOptions, source, sourceDetail);
        }
        catch (Exception ex)
        {
            errorMessage = NormalizeNullableText(ex.Message, 500) ?? "AI生成失败";
            return StatusCode(500, new { message = "AI生成失败，请稍后重试" });
        }
        finally
        {
            timer.Stop();
            var logMessage = !string.IsNullOrWhiteSpace(errorMessage)
                ? errorMessage
                : (string.Equals(source, "fallback", StringComparison.OrdinalIgnoreCase) ? sourceDetail : null);

            db.AiVoteSuggestionLogs.Add(new AiVoteSuggestionLog
            {
                RequestId = requestId,
                AppUserId = appUserId,
                ContentPreview = NormalizeText(content, 200),
                Mood = NormalizeText(mood, 20),
                LocationTag = NormalizeText(locationTag, 50),
                RequestedOptionCount = optionCount,
                GeneratedTitle = generatedTitle,
                GeneratedOptionsJson = generatedOptions.Count > 0 ? JsonSerializer.Serialize(generatedOptions, JsonOptions) : null,
                Source = string.IsNullOrWhiteSpace(source) ? "fallback" : source,
                Status = string.IsNullOrWhiteSpace(status) ? "failed" : status,
                ErrorMessage = logMessage,
                RawResponse = rawResponse,
                DurationMs = (int)Math.Clamp(timer.ElapsedMilliseconds, 0, int.MaxValue),
                CreateTime = now
            });

            await db.SaveChangesAsync(cancellationToken);
        }
    }

    private async Task<AiVoteSuggestionConfig> GetOrCreateConfigAsync(CancellationToken cancellationToken)
    {
        var config = await db.AiVoteSuggestionConfigs.FirstOrDefaultAsync(c => c.Id == 1, cancellationToken);
        if (config is not null) return config;

        config = new AiVoteSuggestionConfig
        {
            Id = 1,
            IsEnabled = false,
            BaseUrl = "https://api.openai.com/v1",
            Model = "gpt-4o-mini",
            ApiKey = null,
            SystemPrompt = "你是投票助手。请只返回JSON对象，格式为{\"title\":\"...\",\"options\":[\"...\",\"...\"]}。",
            Temperature = 0.7m,
            MaxTokens = 300,
            DefaultOptionCount = 3,
            TimeoutSeconds = 20,
            EnableFallback = true,
            PerUserMinuteLimit = 5,
            UpdateTime = DateTime.UtcNow,
            UpdatedBy = "system"
        };

        db.AiVoteSuggestionConfigs.Add(config);
        await db.SaveChangesAsync(cancellationToken);
        return config;
    }

    private Guid? GetCurrentAppUserIdOrNull()
    {
        if (User.Identity?.IsAuthenticated != true) return null;
        if (!User.HasTokenUse(AuthTokenUses.AppUser)) return null;
        return User.TryGetSubjectId(out var userId) ? userId : null;
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

    private static List<string> NormalizeVoteOptions(List<string>? options, int optionCount)
    {
        var safeCount = Math.Clamp(optionCount, 2, 4);
        return (options ?? [])
            .Select(item => NormalizeText(item, 20))
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.Ordinal)
            .Take(safeCount)
            .ToList();
    }
}
