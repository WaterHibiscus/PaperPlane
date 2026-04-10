using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Services;

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

        return new StatsResponse(totalPlanes, activePlanes, todayThrows, totalLocations, totalComments);
    }
}
