using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Services;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<ActionResult<StatsResponse>> GetStats()
    {
        var now = DateTime.UtcNow;
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);

        var totalPlanes = await db.Planes.IgnoreQueryFilters().CountAsync();
        var activePlanes = await db.Planes.CountAsync(p => p.ExpireTime > now);
        var todayThrows = await db.Planes.IgnoreQueryFilters().CountAsync(p => p.CreateTime >= todayStart);
        var totalLocations = await db.Locations.CountAsync(l => l.IsActive);
        var totalComments = await db.Comments.CountAsync();
        var activeMoodRows = await db.Planes
            .Where(p => p.ExpireTime > now)
            .Select(p => p.Mood)
            .ToListAsync();

        var moodConfigByKey = BuildMoodConfigMap();
        var activeMoodDistribution = activeMoodRows
            .Select(rawMood => ResolveMoodLabel(rawMood, moodConfigByKey))
            .GroupBy(label => label, StringComparer.Ordinal)
            .Select(group => new MoodStatItemResponse(group.Key, group.Count()))
            .OrderByDescending(item => item.Count)
            .ThenBy(item => item.Mood, StringComparer.Ordinal)
            .ToList();

        return new StatsResponse(
            totalPlanes,
            activePlanes,
            todayThrows,
            totalLocations,
            totalComments,
            activeMoodDistribution);
    }

    private Dictionary<string, MoodSettingItem> BuildMoodConfigMap()
    {
        var moodItems = HttpContext.RequestServices
            .GetRequiredService<MoodSettingsService>()
            .GetAll();

        return moodItems
            .Where(item => !string.IsNullOrWhiteSpace(item.Key))
            .GroupBy(item => item.Key.Trim().ToLowerInvariant(), StringComparer.Ordinal)
            .ToDictionary(
                group => group.Key,
                group => group
                    .OrderByDescending(item => item.IsActive)
                    .ThenBy(item => item.SortOrder)
                    .First(),
                StringComparer.Ordinal);
    }

    private static string ResolveMoodLabel(string? rawMood, IReadOnlyDictionary<string, MoodSettingItem> moodConfigByKey)
    {
        var mood = (rawMood ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(mood))
        {
            return "未设置";
        }

        var lookupKey = mood.ToLowerInvariant();
        if (moodConfigByKey.TryGetValue(lookupKey, out var config))
        {
            return string.IsNullOrWhiteSpace(config.Label) ? mood : config.Label.Trim();
        }

        return mood;
    }
}
