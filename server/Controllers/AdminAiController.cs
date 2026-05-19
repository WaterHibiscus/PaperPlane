using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AdminOnly)]
[Route("api/admin/ai/vote")]
public class AdminAiController(AppDbContext db) : ControllerBase
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private static readonly HashSet<string> AllowedStatus = new(StringComparer.OrdinalIgnoreCase)
    {
        "success",
        "failed"
    };
    private static readonly HashSet<string> AllowedSource = new(StringComparer.OrdinalIgnoreCase)
    {
        "ai",
        "fallback"
    };

    [HttpGet("config")]
    public async Task<ActionResult<AiVoteConfigResponse>> GetConfig(CancellationToken cancellationToken)
    {
        var config = await GetOrCreateConfigAsync(cancellationToken);
        return ToResponse(config);
    }

    [HttpPut("config")]
    public async Task<ActionResult<AiVoteConfigResponse>> UpdateConfig(
        [FromBody] UpdateAiVoteConfigRequest request,
        CancellationToken cancellationToken)
    {
        var config = await GetOrCreateConfigAsync(cancellationToken);

        var baseUrl = NormalizeText(request.BaseUrl, 300);
        var model = NormalizeText(request.Model, 100);
        var systemPrompt = NormalizeText(request.SystemPrompt, 4000);

        if (string.IsNullOrWhiteSpace(baseUrl))
            return BadRequest(new { message = "Base URL不能为空" });
        if (string.IsNullOrWhiteSpace(model))
            return BadRequest(new { message = "模型名称不能为空" });
        if (string.IsNullOrWhiteSpace(systemPrompt))
            return BadRequest(new { message = "系统提示词不能为空" });

        config.IsEnabled = request.IsEnabled;
        config.BaseUrl = baseUrl;
        config.Model = model;
        config.SystemPrompt = systemPrompt;
        config.Temperature = Math.Clamp(request.Temperature, 0m, 2m);
        config.MaxTokens = Math.Clamp(request.MaxTokens, 64, 1024);
        config.DefaultOptionCount = Math.Clamp(request.DefaultOptionCount, 2, 4);
        config.TimeoutSeconds = Math.Clamp(request.TimeoutSeconds, 5, 60);
        config.EnableFallback = request.EnableFallback;
        config.PerUserMinuteLimit = Math.Clamp(request.PerUserMinuteLimit, 0, 30);
        config.UpdateTime = DateTime.UtcNow;
        config.UpdatedBy = ResolveOperatorName();

        if (request.ClearApiKey)
        {
            config.ApiKey = null;
        }
        else if (!string.IsNullOrWhiteSpace(request.ApiKey))
        {
            config.ApiKey = NormalizeText(request.ApiKey, 500);
        }

        await db.SaveChangesAsync(cancellationToken);
        return ToResponse(config);
    }

    [HttpGet("logs")]
    public async Task<ActionResult<PagedResponse<AiVoteLogItemResponse>>> GetLogs(
        [FromQuery] AiVoteLogQuery query,
        CancellationToken cancellationToken)
    {
        var keyword = NormalizeNullableText(query.Keyword, 100)?.ToLowerInvariant();
        var normalizedStatus = NormalizeNullableText(query.Status, 20)?.ToLowerInvariant();
        var normalizedSource = NormalizeNullableText(query.Source, 20)?.ToLowerInvariant();

        if (!string.IsNullOrWhiteSpace(normalizedStatus) && !AllowedStatus.Contains(normalizedStatus))
            return BadRequest(new { message = "status参数无效" });
        if (!string.IsNullOrWhiteSpace(normalizedSource) && !AllowedSource.Contains(normalizedSource))
            return BadRequest(new { message = "source参数无效" });

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 10, 100);

        var logsQuery = db.AiVoteSuggestionLogs.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(normalizedStatus))
            logsQuery = logsQuery.Where(log => log.Status == normalizedStatus);

        if (!string.IsNullOrWhiteSpace(normalizedSource))
            logsQuery = logsQuery.Where(log => log.Source == normalizedSource);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            logsQuery = logsQuery.Where(log =>
                log.ContentPreview.ToLower().Contains(keyword) ||
                (log.GeneratedTitle != null && log.GeneratedTitle.ToLower().Contains(keyword)) ||
                (log.ErrorMessage != null && log.ErrorMessage.ToLower().Contains(keyword)) ||
                log.RequestId.ToString().ToLower().Contains(keyword));
        }

        var total = await logsQuery.CountAsync(cancellationToken);
        var logs = await logsQuery
            .OrderByDescending(log => log.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = logs.Select(log => new AiVoteLogItemResponse(
            log.Id,
            log.RequestId,
            log.AppUserId,
            log.ContentPreview,
            log.Mood,
            log.LocationTag,
            log.RequestedOptionCount,
            log.GeneratedTitle,
            ParseStringList(log.GeneratedOptionsJson),
            log.Source,
            log.Status,
            log.ErrorMessage,
            log.DurationMs,
            log.CreateTime)).ToList();

        return new PagedResponse<AiVoteLogItemResponse>(items, total);
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

    private static AiVoteConfigResponse ToResponse(AiVoteSuggestionConfig config)
    {
        var hasApiKey = !string.IsNullOrWhiteSpace(config.ApiKey);
        return new AiVoteConfigResponse(
            config.IsEnabled,
            config.BaseUrl,
            config.Model,
            config.Temperature,
            config.MaxTokens,
            config.DefaultOptionCount,
            config.TimeoutSeconds,
            config.EnableFallback,
            config.PerUserMinuteLimit,
            config.SystemPrompt,
            hasApiKey,
            MaskApiKey(config.ApiKey),
            config.UpdateTime,
            config.UpdatedBy);
    }

    private string ResolveOperatorName()
    {
        var name = User.FindFirstValue(ClaimTypes.Name) ?? User.Identity?.Name;
        return NormalizeText(string.IsNullOrWhiteSpace(name) ? "admin" : name, 50);
    }

    private static string MaskApiKey(string? apiKey)
    {
        var value = NormalizeNullableText(apiKey, 500);
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        if (value.Length <= 8) return new string('*', value.Length);
        return $"{value[..4]}****{value[^4..]}";
    }

    private static List<string> ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, JsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
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
}
