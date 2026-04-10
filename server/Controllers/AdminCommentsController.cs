using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AdminOnly)]
[Route("api/admin/comments")]
public class AdminCommentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<AdminCommentItemResponse>>> GetComments([FromQuery] AdminCommentQuery query)
    {
        var keyword = (query.Keyword ?? string.Empty).Trim();
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var commentsQuery = db.Comments
            .IgnoreQueryFilters()
            .AsQueryable();

        if (query.PlaneId.HasValue)
        {
            commentsQuery = commentsQuery.Where(c => c.PlaneId == query.PlaneId.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            commentsQuery = commentsQuery.Where(c =>
                c.Reply.Contains(keyword) ||
                c.NickName.Contains(keyword) ||
                c.Plane.Content.Contains(keyword) ||
                c.Plane.LocationTag.Contains(keyword));
        }

        var total = await commentsQuery.CountAsync();

        var items = await commentsQuery
            .OrderByDescending(c => c.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new AdminCommentItemResponse(
                c.Id,
                c.PlaneId,
                c.Plane.LocationTag,
                c.Plane.Content,
                c.Reply,
                c.NickName,
                c.CreateTime,
                c.ParentCommentId,
                c.ParentComment != null ? c.ParentComment.NickName : null,
                db.Comments.IgnoreQueryFilters().Count(reply => reply.ParentCommentId == c.Id)))
            .ToListAsync();

        return new PagedResponse<AdminCommentItemResponse>(items, total);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteComment(Guid id)
    {
        var target = await db.Comments
            .IgnoreQueryFilters()
            .Select(c => new { c.Id, c.PlaneId })
            .FirstOrDefaultAsync(c => c.Id == id);

        if (target is null)
        {
            return NotFound();
        }

        var planeComments = await db.Comments
            .IgnoreQueryFilters()
            .Where(c => c.PlaneId == target.PlaneId)
            .Select(c => new CommentRelation(c.Id, c.ParentCommentId))
            .ToListAsync();

        var childLookup = planeComments.ToLookup(item => item.ParentCommentId);
        var orderedIds = new List<Guid>();

        CollectDeleteIds(target.Id, childLookup, orderedIds);

        var commentsToDelete = await db.Comments
            .IgnoreQueryFilters()
            .Where(c => orderedIds.Contains(c.Id))
            .ToListAsync();

        var commentMap = commentsToDelete.ToDictionary(c => c.Id);
        foreach (var commentId in orderedIds)
        {
            if (commentMap.TryGetValue(commentId, out var comment))
            {
                db.Comments.Remove(comment);
            }
        }

        await db.SaveChangesAsync();
        return NoContent();
    }

    private static void CollectDeleteIds(Guid commentId, ILookup<Guid?, CommentRelation> childLookup, List<Guid> orderedIds)
    {
        foreach (var child in childLookup[commentId])
        {
            CollectDeleteIds(child.Id, childLookup, orderedIds);
        }

        orderedIds.Add(commentId);
    }

    private record CommentRelation(Guid Id, Guid? ParentCommentId);
}
