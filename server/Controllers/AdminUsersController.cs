using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AdminOnly)]
[Route("api/admin/users")]
public class AdminUsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<AdminUserItemResponse>>> GetUsers([FromQuery] AdminUserQuery query)
    {
        var keyword = (query.Keyword ?? string.Empty).Trim();
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var usersQuery = db.AppUsers.AsQueryable();

        if (query.IsActive.HasValue)
        {
            usersQuery = usersQuery.Where(u => u.IsActive == query.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            usersQuery = usersQuery.Where(u =>
                u.Username.Contains(keyword) ||
                u.StudentId.Contains(keyword) ||
                u.Phone.Contains(keyword));
        }

        var total = await usersQuery.CountAsync();

        var items = await usersQuery
            .OrderByDescending(u => u.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserItemResponse(
                u.Id,
                u.Username,
                u.StudentId,
                u.Phone,
                u.AvatarUrl,
                u.Gender,
                u.Bio,
                u.IsActive,
                u.CreateTime,
                u.LastLoginTime,
                db.Planes.IgnoreQueryFilters().Count(p => p.CreatorUserId == u.Id),
                db.PlaneLikeRecords.Count(r => r.AppUserId == u.Id),
                db.PlanePickRecords.Count(r => r.AppUserId == u.Id)))
            .ToListAsync();

        return new PagedResponse<AdminUserItemResponse>(items, total);
    }

    [HttpPut("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, UpdateAppUserStatusRequest request)
    {
        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Id == id);
        if (user is null)
        {
            return NotFound();
        }

        user.IsActive = request.IsActive;

        if (!request.IsActive)
        {
            var refreshTokens = db.UserRefreshTokens.Where(token => token.AppUserId == user.Id);
            db.UserRefreshTokens.RemoveRange(refreshTokens);
        }

        await db.SaveChangesAsync();
        return NoContent();
    }
}
