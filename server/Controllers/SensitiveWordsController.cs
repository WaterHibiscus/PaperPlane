using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;

namespace server.Controllers;

[ApiController]
[Route("api/sensitive-words")]
public class SensitiveWordsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<SensitiveWordPublicResponse>>> GetPublicRules([FromQuery] string? scope = null)
    {
        var normalizedScope = (scope ?? string.Empty).Trim().ToUpperInvariant();

        var rows = await db.SensitiveWords
            .AsNoTracking()
            .Where(x => x.IsEnabled)
            .OrderByDescending(x => x.Priority)
            .ThenByDescending(x => x.Severity)
            .Select(x => new SensitiveWordPublicResponse(
                x.Word,
                x.MatchMode,
                x.Scope
            ))
            .ToListAsync();

        if (string.IsNullOrWhiteSpace(normalizedScope))
        {
            return rows;
        }

        var result = rows
            .Where(item => item.Scope
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(value => value.ToUpperInvariant())
                .Contains(normalizedScope))
            .ToList();

        return result;
    }
}
