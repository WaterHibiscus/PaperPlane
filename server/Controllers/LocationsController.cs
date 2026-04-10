using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LocationsController(AppDbContext db) : ControllerBase
{
    private static string? NormalizeIconUrl(string? iconUrl)
    {
        var normalized = iconUrl?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    [HttpGet]
    public async Task<ActionResult<List<LocationResponse>>> GetAll([FromQuery] string? keyword)
    {
        var now = DateTime.UtcNow;
        var query = db.Locations
            .Where(l => l.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var normalized = keyword.Trim();
            query = query.Where(l => l.Name.Contains(normalized));
        }

        var locations = await query
            .OrderBy(l => l.SortOrder)
            .Select(l => new LocationResponse(
                l.Id,
                l.Name,
                l.SortOrder,
                db.Planes.Count(p => p.LocationTag == l.Name && p.ExpireTime > now),
                l.IconUrl
            ))
            .ToListAsync();

        return locations;
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<ActionResult<Location>> Create(CreateLocationRequest req)
    {
        var location = new Location
        {
            Name = req.Name,
            IconUrl = NormalizeIconUrl(req.IconUrl),
            SortOrder = req.SortOrder,
            CreateTime = DateTime.UtcNow
        };
        db.Locations.Add(location);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = location.Id }, location);
    }

    [HttpPut("{id}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> Update(int id, UpdateLocationRequest req)
    {
        var location = await db.Locations.FindAsync(id);
        if (location is null) return NotFound();

        location.Name = req.Name;
        location.IconUrl = NormalizeIconUrl(req.IconUrl);
        location.SortOrder = req.SortOrder;
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(int id)
    {
        var location = await db.Locations.FindAsync(id);
        if (location is null) return NotFound();

        location.IsActive = false;
        await db.SaveChangesAsync();
        return NoContent();
    }
}
