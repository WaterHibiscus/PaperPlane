using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/planes/{planeId}/comments")]
public class CommentsController(AppDbContext db, ContentFilterService filter) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<CommentResponse>>> GetComments(Guid planeId)
    {
        var comments = await db.Comments
            .IgnoreQueryFilters()
            .Where(c => c.PlaneId == planeId)
            .OrderBy(c => c.CreateTime)
            .Select(c => new CommentResponse(
                c.Id,
                c.Reply,
                c.NickName,
                c.CreateTime,
                c.ParentCommentId,
                c.ParentComment != null ? c.ParentComment.NickName : null
            ))
            .ToListAsync();

        return comments;
    }

    [HttpPost]
    public async Task<ActionResult<CommentResponse>> AddComment(Guid planeId, AddCommentRequest req)
    {
        var planeExists = await db.Planes.AnyAsync(p => p.Id == planeId);
        if (!planeExists) return NotFound(new { message = "飞机不存在" });

        if (string.IsNullOrWhiteSpace(req.Reply))
            return BadRequest(new { message = "评论内容不能为空" });

        var (passed, reason) = filter.Check(req.Reply);
        if (!passed)
            return BadRequest(new { message = reason });

        Comment? parentComment = null;
        if (req.ParentCommentId.HasValue)
        {
            parentComment = await db.Comments
                .FirstOrDefaultAsync(c => c.Id == req.ParentCommentId.Value && c.PlaneId == planeId);

            if (parentComment is null)
                return BadRequest(new { message = "回复目标不存在" });
        }

        var nickName = req.IsAnonymous
            ? NicknameGenerator.Generate()
            : (req.NickName ?? string.Empty).Trim();

        if (!req.IsAnonymous)
        {
            if (string.IsNullOrWhiteSpace(nickName))
                return BadRequest(new { message = "请输入昵称" });

            if (nickName.Length > 30)
                return BadRequest(new { message = "昵称不能超过30个字符" });
        }

        var comment = new Comment
        {
            Id = Guid.NewGuid(),
            PlaneId = planeId,
            ParentCommentId = parentComment?.Id,
            Reply = req.Reply,
            NickName = nickName,
            CreateTime = DateTime.UtcNow
        };

        db.Comments.Add(comment);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetComments), new { planeId },
            new CommentResponse(
                comment.Id,
                comment.Reply,
                comment.NickName,
                comment.CreateTime,
                comment.ParentCommentId,
                parentComment?.NickName
            ));
    }
}
