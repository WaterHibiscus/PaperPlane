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
[Route("api/admin/sensitive-words")]
public class AdminSensitiveWordsController(AppDbContext db) : ControllerBase
{
    private static readonly HashSet<string> AllowedCategories = new(StringComparer.OrdinalIgnoreCase)
    {
        "GENERAL", "ABUSE", "ADS", "CONTACT"
    };

    private static readonly HashSet<string> AllowedMatchModes = new(StringComparer.OrdinalIgnoreCase)
    {
        "CONTAINS", "EXACT"
    };

    private static readonly HashSet<string> AllowedHandleModes = new(StringComparer.OrdinalIgnoreCase)
    {
        "BLOCK", "REVIEW", "REPLACE"
    };

    private static readonly HashSet<string> AllowedScopes = new(StringComparer.OrdinalIgnoreCase)
    {
        "PLANE", "COMMENT", "NICKNAME"
    };

    [HttpGet]
    public async Task<ActionResult<List<SensitiveWordConfigResponse>>> GetAll()
    {
        var items = await db.SensitiveWords
            .AsNoTracking()
            .OrderByDescending(x => x.Priority)
            .ThenByDescending(x => x.Severity)
            .ThenBy(x => x.Word)
            .Select(ToResponseExpression())
            .ToListAsync();

        return items;
    }

    [HttpPut]
    public async Task<ActionResult<List<SensitiveWordConfigResponse>>> Update(
        [FromBody] UpdateSensitiveWordsRequest request,
        CancellationToken cancellationToken)
    {
        var items = request.Items ?? [];
        var now = DateTime.UtcNow;
        var currentAdminId = User.TryGetSubjectId(out var adminId) ? adminId : (Guid?)null;

        var nextItems = new List<SensitiveWord>();
        var normalizedSet = new HashSet<string>(StringComparer.Ordinal);

        foreach (var input in items)
        {
            var normalizedWord = NormalizeWord(input.Word);
            if (string.IsNullOrWhiteSpace(normalizedWord))
                return BadRequest(new { message = "敏感词不能为空" });

            if (!normalizedSet.Add(normalizedWord))
                return BadRequest(new { message = $"敏感词重复：{input.Word}" });

            var category = NormalizeEnum(input.Category, AllowedCategories, "GENERAL");
            var matchMode = NormalizeEnum(input.MatchMode, AllowedMatchModes, "CONTAINS");
            var handleMode = NormalizeEnum(input.HandleMode, AllowedHandleModes, "BLOCK");
            var scope = NormalizeScope(input.Scope);

            if (string.IsNullOrWhiteSpace(scope))
                return BadRequest(new { message = $"敏感词生效范围无效：{input.Word}" });

            var word = input.Word?.Trim() ?? string.Empty;
            if (word.Length == 0 || word.Length > 100)
                return BadRequest(new { message = $"敏感词长度需在1-100字符内：{input.Word}" });

            var replaceText = string.IsNullOrWhiteSpace(input.ReplaceText) ? null : input.ReplaceText.Trim();
            if (replaceText is { Length: > 50 })
                return BadRequest(new { message = $"替换文本不能超过50字符：{input.Word}" });

            var remark = string.IsNullOrWhiteSpace(input.Remark) ? null : input.Remark.Trim();
            if (remark is { Length: > 200 })
                return BadRequest(new { message = $"备注不能超过200字符：{input.Word}" });

            var entity = new SensitiveWord
            {
                Id = input.Id.GetValueOrDefault() == Guid.Empty ? Guid.NewGuid() : input.Id!.Value,
                Word = word,
                NormalizedWord = normalizedWord,
                Category = category,
                MatchMode = matchMode,
                HandleMode = handleMode,
                ReplaceText = replaceText,
                Scope = scope,
                Severity = Math.Clamp(input.Severity, 1, 10),
                Priority = Math.Clamp(input.Priority, 0, 9999),
                IsEnabled = input.IsEnabled,
                Remark = remark,
                CreateAdminId = currentAdminId,
                UpdateAdminId = currentAdminId,
                CreateTime = now,
                UpdateTime = now
            };

            nextItems.Add(entity);
        }

        var existing = await db.SensitiveWords.ToListAsync(cancellationToken);
        db.SensitiveWords.RemoveRange(existing);

        foreach (var item in nextItems)
        {
            var old = existing.FirstOrDefault(x => x.Id == item.Id);
            if (old is not null)
            {
                item.CreateTime = old.CreateTime;
                item.CreateAdminId = old.CreateAdminId;
            }
        }

        await db.SensitiveWords.AddRangeAsync(nextItems, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var result = await db.SensitiveWords
            .AsNoTracking()
            .OrderByDescending(x => x.Priority)
            .ThenByDescending(x => x.Severity)
            .ThenBy(x => x.Word)
            .Select(ToResponseExpression())
            .ToListAsync(cancellationToken);

        return result;
    }

    [HttpGet("ai-suggestions")]
    public async Task<ActionResult<List<AiSensitiveWordSuggestionResponse>>> GetAiSuggestions(CancellationToken cancellationToken)
    {
        var items = await db.AiSensitiveWordSuggestions
            .AsNoTracking()
            .OrderByDescending(x => x.CreateTime)
            .ThenByDescending(x => x.Confidence)
            .Select(ToAiSuggestionResponseExpression())
            .ToListAsync(cancellationToken);

        return items;
    }

    [HttpPost("ai-suggestions/{id:int}/adopt")]
    public async Task<ActionResult<SensitiveWordConfigResponse>> AdoptAiSuggestion(int id, CancellationToken cancellationToken)
    {
        var suggestion = await db.AiSensitiveWordSuggestions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (suggestion is null)
            return NotFound(new { message = "待采纳记录不存在" });

        var now = DateTime.UtcNow;
        var currentAdminId = User.TryGetSubjectId(out var adminId) ? adminId : (Guid?)null;
        var normalizedWord = NormalizeWord(suggestion.SuggestedWord);

        var word = await db.SensitiveWords.FirstOrDefaultAsync(x => x.NormalizedWord == normalizedWord, cancellationToken);
        if (word is null)
        {
            word = new SensitiveWord
            {
                Id = Guid.NewGuid(),
                Word = suggestion.SuggestedWord.Trim(),
                NormalizedWord = normalizedWord,
                Category = NormalizeEnum(suggestion.Category, AllowedCategories, "GENERAL"),
                MatchMode = NormalizeEnum(suggestion.MatchMode, AllowedMatchModes, "CONTAINS"),
                HandleMode = NormalizeEnum(suggestion.HandleMode, AllowedHandleModes, "BLOCK"),
                ReplaceText = string.IsNullOrWhiteSpace(suggestion.ReplaceText) ? null : suggestion.ReplaceText.Trim(),
                Scope = NormalizeScope(suggestion.Scope),
                Severity = Math.Clamp(suggestion.Severity, 1, 10),
                Priority = Math.Clamp(suggestion.Priority, 0, 9999),
                IsEnabled = true,
                Remark = BuildAdoptedRemark(suggestion.Remark, suggestion.Reason),
                CreateAdminId = currentAdminId,
                UpdateAdminId = currentAdminId,
                CreateTime = now,
                UpdateTime = now
            };

            db.SensitiveWords.Add(word);
        }
        else
        {
            word.Scope = MergeScope(word.Scope, suggestion.Scope);
            word.IsEnabled = true;
            word.UpdateAdminId = currentAdminId;
            word.UpdateTime = now;
            word.Severity = Math.Max(word.Severity, Math.Clamp(suggestion.Severity, 1, 10));
            word.Priority = Math.Max(word.Priority, Math.Clamp(suggestion.Priority, 0, 9999));

            if (string.Equals(word.Category, "GENERAL", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(suggestion.Category, "GENERAL", StringComparison.OrdinalIgnoreCase))
            {
                word.Category = NormalizeEnum(suggestion.Category, AllowedCategories, "GENERAL");
            }

            if (string.IsNullOrWhiteSpace(word.ReplaceText) && !string.IsNullOrWhiteSpace(suggestion.ReplaceText))
            {
                word.ReplaceText = suggestion.ReplaceText.Trim();
            }

            var remark = BuildAdoptedRemark(word.Remark, suggestion.Reason);
            if (!string.IsNullOrWhiteSpace(remark))
            {
                word.Remark = remark;
            }
        }

        db.AiSensitiveWordSuggestions.Remove(suggestion);
        await db.SaveChangesAsync(cancellationToken);

        return ToResponse(word);
    }

    [HttpDelete("ai-suggestions/{id:int}")]
    public async Task<IActionResult> DeleteAiSuggestion(int id, CancellationToken cancellationToken)
    {
        var suggestion = await db.AiSensitiveWordSuggestions.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
        if (suggestion is null)
            return NotFound(new { message = "待采纳记录不存在" });

        db.AiSensitiveWordSuggestions.Remove(suggestion);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static System.Linq.Expressions.Expression<Func<SensitiveWord, SensitiveWordConfigResponse>> ToResponseExpression()
    {
        return item => new SensitiveWordConfigResponse(
            item.Id,
            item.Word,
            item.Category,
            item.MatchMode,
            item.HandleMode,
            item.ReplaceText,
            item.Scope,
            item.Severity,
            item.Priority,
            item.IsEnabled,
            item.Remark
        );
    }

    private static SensitiveWordConfigResponse ToResponse(SensitiveWord item)
    {
        return new SensitiveWordConfigResponse(
            item.Id,
            item.Word,
            item.Category,
            item.MatchMode,
            item.HandleMode,
            item.ReplaceText,
            item.Scope,
            item.Severity,
            item.Priority,
            item.IsEnabled,
            item.Remark
        );
    }

    private static System.Linq.Expressions.Expression<Func<AiSensitiveWordSuggestion, AiSensitiveWordSuggestionResponse>>
        ToAiSuggestionResponseExpression()
    {
        return item => new AiSensitiveWordSuggestionResponse(
            item.Id,
            item.SuggestedWord,
            item.Category,
            item.MatchMode,
            item.HandleMode,
            item.ReplaceText,
            item.Scope,
            item.Severity,
            item.Priority,
            item.Remark,
            item.SourceTextPreview,
            item.Reason,
            item.Confidence,
            item.CreateTime
        );
    }

    private static string NormalizeWord(string? word)
    {
        return (word ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string NormalizeEnum(string? value, HashSet<string> allowedValues, string fallback)
    {
        var normalized = (value ?? string.Empty).Trim().ToUpperInvariant();
        return allowedValues.Contains(normalized) ? normalized : fallback;
    }

    private static string NormalizeScope(string? scope)
    {
        var values = (scope ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => item.ToUpperInvariant())
            .Where(AllowedScopes.Contains)
            .Distinct(StringComparer.Ordinal)
            .ToList();

        return string.Join(",", values);
    }

    private static string MergeScope(string? currentScope, string? nextScope)
    {
        var merged = (currentScope ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Concat((nextScope ?? string.Empty)
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
            .Select(item => item.ToUpperInvariant())
            .Where(AllowedScopes.Contains)
            .Distinct(StringComparer.Ordinal);

        return string.Join(",", merged);
    }

    private static string? BuildAdoptedRemark(string? currentRemark, string? aiReason)
    {
        var normalizedCurrent = string.IsNullOrWhiteSpace(currentRemark) ? null : currentRemark.Trim();
        var normalizedReason = string.IsNullOrWhiteSpace(aiReason) ? null : aiReason.Trim();

        if (normalizedReason is null)
            return normalizedCurrent;

        var aiRemark = $"AI采纳：{normalizedReason}";
        if (normalizedCurrent is null)
            return aiRemark;
        if (normalizedCurrent.Contains(aiRemark, StringComparison.Ordinal))
            return normalizedCurrent;

        var merged = $"{normalizedCurrent}；{aiRemark}";
        return merged.Length <= 200 ? merged : merged[..200];
    }
}
