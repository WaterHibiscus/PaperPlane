using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Services;

public sealed record ContentFilterResult(bool Passed, string Content, string? Reason);

public class ContentFilterService(AppDbContext db, AiSensitiveReviewService aiSensitiveReviewService)
{
    public async Task<ContentFilterResult> CheckAsync(string content, string scope, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(content))
            return Fail(content, "内容不能为空");

        if (content.Length > 200)
            return Fail(content, "内容不能超过200字");

        var filteredContent = content;
        var rules = await db.SensitiveWords
            .AsNoTracking()
            .Where(x => x.IsEnabled)
            .OrderByDescending(x => x.Priority)
            .ThenByDescending(x => x.Severity)
            .ToListAsync(cancellationToken);

        foreach (var rule in rules)
        {
            if (!IsScopeMatched(rule.Scope, scope))
                continue;

            var normalizedWord = Normalize(rule.NormalizedWord);
            if (string.IsNullOrWhiteSpace(normalizedWord))
                continue;

            var normalizedContent = Normalize(filteredContent);
            if (!IsMatched(normalizedContent, normalizedWord, rule.MatchMode))
                continue;

            var handleMode = (rule.HandleMode ?? "BLOCK").Trim().ToUpperInvariant();
            if (handleMode is "BLOCK" or "REVIEW")
                return Fail(filteredContent, "内容包含敏感词，请修改后重试");

            if (handleMode == "REPLACE")
            {
                var replacement = string.IsNullOrWhiteSpace(rule.ReplaceText)
                    ? "***"
                    : rule.ReplaceText.Trim();
                filteredContent = ReplaceContent(filteredContent, normalizedWord, replacement, rule.MatchMode);

                if (filteredContent.Length > 200)
                    return Fail(filteredContent, "内容不能超过200字");
            }
        }

        var aiReview = await aiSensitiveReviewService.ReviewAsync(filteredContent, scope, cancellationToken);
        if (aiReview.ShouldBlock && !string.IsNullOrWhiteSpace(aiReview.SuggestedWord))
        {
            await SaveAiSuggestionAsync(aiReview, filteredContent, scope, cancellationToken);
            return Fail(filteredContent, "内容疑似包含敏感信息，已拦截并提交人工审核，请修改后重试");
        }

        return new ContentFilterResult(true, filteredContent, null);
    }

    private static string Normalize(string? value)
    {
        return (value ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static ContentFilterResult Fail(string content, string reason)
    {
        return new ContentFilterResult(false, content, reason);
    }

    private static string ReplaceContent(string content, string normalizedWord, string replacement, string? matchMode)
    {
        var mode = (matchMode ?? "CONTAINS").Trim().ToUpperInvariant();
        if (mode == "EXACT")
        {
            return string.Equals(Normalize(content), normalizedWord, StringComparison.Ordinal)
                ? replacement
                : content;
        }

        return content.Replace(normalizedWord, replacement, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsMatched(string normalizedContent, string normalizedWord, string? matchMode)
    {
        var mode = (matchMode ?? "CONTAINS").Trim().ToUpperInvariant();
        return mode switch
        {
            "EXACT" => string.Equals(normalizedContent, normalizedWord, StringComparison.Ordinal),
            _ => normalizedContent.Contains(normalizedWord, StringComparison.Ordinal)
        };
    }

    private static bool IsScopeMatched(string? rawScope, string scope)
    {
        if (string.IsNullOrWhiteSpace(rawScope))
            return false;

        var normalizedScope = scope.Trim().ToUpperInvariant();
        var scopes = rawScope
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(item => item.ToUpperInvariant());

        return scopes.Contains(normalizedScope);
    }

    private async Task SaveAiSuggestionAsync(
        AiSensitiveReviewResult review,
        string sourceText,
        string scope,
        CancellationToken cancellationToken)
    {
        var suggestedWord = review.SuggestedWord?.Trim();
        if (string.IsNullOrWhiteSpace(suggestedWord))
            return;

        var normalizedWord = Normalize(suggestedWord);
        var normalizedScope = scope.Trim().ToUpperInvariant();

        var libraryScopes = await db.SensitiveWords
            .AsNoTracking()
            .Where(x => x.NormalizedWord == normalizedWord)
            .Select(x => x.Scope)
            .ToListAsync(cancellationToken);

        var existsInLibrary = libraryScopes.Any(rawScope => IsScopeMatched(rawScope, normalizedScope));

        if (existsInLibrary)
            return;

        var existsPending = await db.AiSensitiveWordSuggestions
            .AsNoTracking()
            .AnyAsync(x => x.NormalizedWord == normalizedWord && x.Scope == normalizedScope, cancellationToken);

        if (existsPending)
            return;

        db.AiSensitiveWordSuggestions.Add(new AiSensitiveWordSuggestion
        {
            SuggestedWord = suggestedWord,
            NormalizedWord = normalizedWord,
            Category = review.Category,
            MatchMode = review.MatchMode,
            HandleMode = review.HandleMode,
            ReplaceText = review.ReplaceText,
            Scope = normalizedScope,
            Severity = Math.Clamp(review.Severity, 1, 10),
            Priority = Math.Clamp(review.Priority, 0, 9999),
            Remark = "AI suggested review",
            SourceTextPreview = sourceText.Length > 200 ? sourceText[..200] : sourceText,
            Reason = string.IsNullOrWhiteSpace(review.Reason) ? null : review.Reason.Trim(),
            Confidence = review.Confidence,
            RawResponse = review.RawResponse,
            CreateTime = DateTime.UtcNow
        });

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException ex) when (ex.InnerException is SqlException { Number: 2601 or 2627 })
        {
            db.ChangeTracker.Clear();
        }
    }
}
