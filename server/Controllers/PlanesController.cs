using System.Text;
using System.Text.Json;
using System.Security.Cryptography;
using System.Linq.Expressions;
using System.Net;
using Microsoft.Data.SqlClient;
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
public class PlanesController(
    AppDbContext db,
    ContentFilterService filter,
    ExpireOptionSettingsService expireOptionSettingsService,
    PlaneQrCodeService planeQrCodeService) : ControllerBase
{
    private static readonly JsonSerializerOptions VoteJsonOptions = new(JsonSerializerDefaults.Web);
    private const string ShortCodeAlphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private const int ShortCodeLength = 10;

    [HttpPost]
    public async Task<ActionResult<PlaneResponse>> Throw(ThrowPlaneRequest req)
    {
        var (passed, reason) = filter.Check(req.Content);
        if (!passed)
            return BadRequest(new { message = reason });

        var expireHours = Math.Clamp(req.ExpireHours, 1, 168);
        var activeExpireHours = expireOptionSettingsService.GetActive()
            .Select(item => item.Hours)
            .ToHashSet();
        if (activeExpireHours.Count > 0 && !activeExpireHours.Contains(expireHours))
            return BadRequest(new { message = "当前存活时间不可选" });
        var authorName = req.IsAnonymous ? null : (req.AuthorName ?? string.Empty).Trim();
        if (!req.IsAnonymous)
        {
            if (string.IsNullOrWhiteSpace(authorName))
                return BadRequest(new { message = "实名投递需要昵称" });

            if (authorName.Length > 30)
                return BadRequest(new { message = "昵称不能超过30个字符" });
        }

        var voteOptions = NormalizeVoteOptions(req.VoteOptions);
        var voteTitle = string.IsNullOrWhiteSpace(req.VoteTitle) ? null : req.VoteTitle.Trim();
        var imageUrls = NormalizeImageUrls(req.ImageUrls);
        if (voteOptions.Count == 1)
            return BadRequest(new { message = "投票至少填写两个选项" });

        if (voteOptions.Count > 0 && voteTitle is null)
            return BadRequest(new { message = "请填写投票标题" });

        if (imageUrls.Count > 9)
            return BadRequest(new { message = "最多上传9张图片" });

        var now = DateTime.UtcNow;
        const int maxShortCodeRetries = 5;
        for (var attempt = 0; attempt < maxShortCodeRetries; attempt += 1)
        {
            var plane = new Plane
            {
                Id = Guid.NewGuid(),
                ShortCode = await GenerateUniqueShortCodeAsync(),
                CreatorUserId = GetCurrentAppUserIdOrNull(),
                LocationTag = req.LocationTag,
                Content = req.Content,
                Mood = req.Mood,
                IsAnonymous = req.IsAnonymous,
                AuthorName = authorName,
                ImageUrlsJson = imageUrls.Count > 0 ? JsonSerializer.Serialize(imageUrls, VoteJsonOptions) : null,
                VoteTitle = voteTitle,
                VoteOptionsJson = voteOptions.Count > 0 ? JsonSerializer.Serialize(voteOptions, VoteJsonOptions) : null,
                CreateTime = now,
                ExpireTime = now.AddHours(expireHours)
            };

            db.Planes.Add(plane);
            try
            {
                await db.SaveChangesAsync();
                return CreatedAtAction(nameof(GetById), new { id = plane.Id }, ToResponse(plane, 0));
            }
            catch (DbUpdateException ex) when (IsShortCodeUniqueConflict(ex))
            {
                db.Entry(plane).State = EntityState.Detached;
            }
        }

        throw new InvalidOperationException("纸条短号生成失败，请稍后重试");
    }

    [HttpGet]
    public async Task<ActionResult<List<PlaneResponse>>> GetByLocation([FromQuery] string? location)
    {
        var now = DateTime.UtcNow;
        var query = db.Planes.Where(p => p.ExpireTime > now);

        if (!string.IsNullOrEmpty(location))
            query = query.Where(p => p.LocationTag == location);

        var rows = await query
            .OrderByDescending(p => p.LikeCount)
            .ThenByDescending(p => p.CreateTime)
            .Select(p => new PlaneRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.IsAnonymous,
                p.AuthorName,
                p.ImageUrlsJson,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount,
                p.VoteTitle,
                p.VoteOptionsJson))
            .ToListAsync();

        return rows.Select(ToResponse).ToList();
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlaneResponse>> GetById(Guid id)
    {
        return await GetByIdentityAsync(p => p.Id == id);
    }

    [HttpGet("by-code/{code}")]
    public async Task<ActionResult<PlaneResponse>> GetByCode(string code)
    {
        var normalizedCode = NormalizeShortCode(code);
        if (normalizedCode is null)
            return BadRequest(new { message = "纸条短号格式错误" });

        return await GetByIdentityAsync(p => p.ShortCode == normalizedCode);
    }

    [HttpGet("{id:guid}/qrcode.png")]
    public async Task<IActionResult> GetQrCodePng(Guid id)
    {
        var shortCode = await db.Planes
            .IgnoreQueryFilters()
            .Where(p => p.Id == id && !p.IsDeleted)
            .Select(p => p.ShortCode)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(shortCode)) return NotFound();

        var png = planeQrCodeService.BuildPng($"PP{shortCode}");
        return File(png, "image/png");
    }

    [HttpGet("{id:guid}/qrcode.svg")]
    public async Task<IActionResult> GetQrCodeSvg(Guid id)
    {
        var shortCode = await db.Planes
            .IgnoreQueryFilters()
            .Where(p => p.Id == id && !p.IsDeleted)
            .Select(p => p.ShortCode)
            .FirstOrDefaultAsync();
        if (string.IsNullOrWhiteSpace(shortCode)) return NotFound();

        var svg = planeQrCodeService.BuildSvg($"PP{shortCode}");
        return Content(svg, "image/svg+xml", Encoding.UTF8);
    }

    [HttpGet("random")]
    public async Task<ActionResult<PlaneResponse>> GetRandom()
    {
        var count = await db.Planes
            .IgnoreQueryFilters()
            .CountAsync(p => !p.IsDeleted);
        if (count == 0) return NotFound(new { message = "暂无飞机" });

        var skip = Random.Shared.Next(count);
        var row = await db.Planes
            .IgnoreQueryFilters()
            .Where(p => !p.IsDeleted)
            .OrderBy(p => p.Id)
            .Skip(skip)
            .Select(p => new PlaneRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.IsAnonymous,
                p.AuthorName,
                p.ImageUrlsJson,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount,
                p.VoteTitle,
                p.VoteOptionsJson))
            .FirstAsync();

        var plane = await db.Planes
            .IgnoreQueryFilters()
            .FirstAsync(p => p.Id == row.Id && !p.IsDeleted);
        plane.PickCount++;

        var appUserId = GetCurrentAppUserIdOrNull();
        if (appUserId.HasValue)
        {
            await UpsertPickRecordAsync(plane.Id, appUserId.Value, DateTime.UtcNow);
        }

        await db.SaveChangesAsync();

        return ToResponse(row with { PickCount = row.PickCount + 1 });
    }

    [HttpGet("random/candidates")]
    public async Task<ActionResult<RandomCandidateListResponse>> GetRandomCandidates()
    {
        if (!CanAccessRandomCandidates()) return Forbid();

        var now = DateTime.UtcNow;
        var rows = await db.Planes
            .IgnoreQueryFilters()
            .Where(p => !p.IsDeleted)
            .OrderBy(p => p.Id)
            .Select(p => new RandomCandidateRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.CreateTime,
                p.ExpireTime,
                p.RecalledAt,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount))
            .ToListAsync();

        var items = rows
            .Select((row, index) =>
            {
                var status = ResolveStatus(row.RecalledAt, row.ExpireTime, now);
                return new RandomCandidateItemResponse(
                    index + 1,
                    row.Id,
                    row.ShortCode,
                    row.LocationTag,
                    row.Content,
                    row.Mood,
                    row.CreateTime,
                    row.ExpireTime,
                    row.RecalledAt,
                    status,
                    row.ExpireTime <= now,
                    row.RecalledAt != null,
                    row.PickCount,
                    row.LikeCount,
                    row.CommentCount,
                    row.ReportCount);
            })
            .ToList();

        return new RandomCandidateListResponse(now, items.Count, items);
    }

    [HttpGet("trending")]
    public async Task<ActionResult<List<PlaneResponse>>> GetTrending()
    {
        var now = DateTime.UtcNow;
        var rows = await db.Planes
            .Where(p => p.ExpireTime > now)
            .OrderByDescending(p => p.LikeCount)
            .Take(20)
            .Select(p => new PlaneRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.IsAnonymous,
                p.AuthorName,
                p.ImageUrlsJson,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount,
                p.VoteTitle,
                p.VoteOptionsJson))
            .ToListAsync();

        return rows.Select(ToResponse).ToList();
    }

    [HttpPost("mine")]
    public async Task<ActionResult<List<PlaneResponse>>> GetMyPlanes(MyPlanesRequest req)
    {
        var ids = req.Ids ?? [];
        if (ids.Count == 0) return new List<PlaneResponse>();

        var rows = await db.Planes
            .IgnoreQueryFilters()
            .Where(p => ids.Contains(p.Id) && !p.IsDeleted)
            .OrderByDescending(p => p.CreateTime)
            .Select(p => new PlaneRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.IsAnonymous,
                p.AuthorName,
                p.ImageUrlsJson,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount,
                p.VoteTitle,
                p.VoteOptionsJson))
            .ToListAsync();

        return rows.Select(ToResponse).ToList();
    }

    [HttpGet("mine/thrown")]
    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    public async Task<ActionResult<MinePlaneListResponse>> GetMyThrownPlanes([FromQuery] MinePlaneQuery query)
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var status = NormalizeStatus(query.Status);
        if (status is null)
            return BadRequest(new { message = "status 仅支持 all、active、recalled、expired" });

        var now = DateTime.UtcNow;
        var keyword = (query.Keyword ?? string.Empty).Trim();
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var thrownQuery = db.Planes
            .IgnoreQueryFilters()
            .Where(p => !p.IsDeleted && p.CreatorUserId == userId);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            thrownQuery = thrownQuery.Where(p =>
                p.Content.Contains(keyword) || p.LocationTag.Contains(keyword));
        }

        thrownQuery = status switch
        {
            "active" => thrownQuery.Where(p => p.RecalledAt == null && p.ExpireTime > now),
            "recalled" => thrownQuery.Where(p => p.RecalledAt != null),
            "expired" => thrownQuery.Where(p => p.RecalledAt == null && p.ExpireTime <= now),
            _ => thrownQuery
        };

        var total = await thrownQuery.CountAsync();
        var rows = await thrownQuery
            .OrderByDescending(p => p.CreateTime)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new MinePlaneRow(
                p.Id,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.RecalledAt,
                null,
                null))
            .ToListAsync();

        var items = rows.Select(row => ToMineItemResponse(row, now)).ToList();
        return new MinePlaneListResponse(items, total);
    }

    [HttpGet("mine/fueled")]
    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    public async Task<ActionResult<MinePlaneListResponse>> GetMyFueledPlanes([FromQuery] MineHistoryQuery query)
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var keyword = (query.Keyword ?? string.Empty).Trim();
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var now = DateTime.UtcNow;

        var fueledQuery = db.PlaneLikeRecords
            .Where(r => r.AppUserId == userId)
            .Join(
                db.Planes.IgnoreQueryFilters().Where(p => !p.IsDeleted),
                record => record.PlaneId,
                plane => plane.Id,
                (record, plane) => new { record, plane });

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            fueledQuery = fueledQuery.Where(x =>
                x.plane.Content.Contains(keyword) || x.plane.LocationTag.Contains(keyword));
        }

        var total = await fueledQuery.CountAsync();
        var rows = await fueledQuery
            .OrderByDescending(x => x.record.FueledAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new MinePlaneRow(
                x.plane.Id,
                x.plane.LocationTag,
                x.plane.Content,
                x.plane.Mood,
                x.plane.CreateTime,
                x.plane.ExpireTime,
                x.plane.PickCount,
                x.plane.LikeCount,
                x.plane.Comments.Count,
                x.plane.RecalledAt,
                x.record.FueledAt,
                null))
            .ToListAsync();

        var items = rows.Select(row => ToMineItemResponse(row, now)).ToList();
        return new MinePlaneListResponse(items, total);
    }

    [HttpGet("mine/picked")]
    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    public async Task<ActionResult<MinePlaneListResponse>> GetMyPickedPlanes([FromQuery] MineHistoryQuery query)
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var keyword = (query.Keyword ?? string.Empty).Trim();
        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);
        var now = DateTime.UtcNow;

        var pickedQuery = db.PlanePickRecords
            .Where(r => r.AppUserId == userId)
            .Join(
                db.Planes.IgnoreQueryFilters().Where(p => !p.IsDeleted),
                record => record.PlaneId,
                plane => plane.Id,
                (record, plane) => new { record, plane });

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            pickedQuery = pickedQuery.Where(x =>
                x.plane.Content.Contains(keyword) || x.plane.LocationTag.Contains(keyword));
        }

        var total = await pickedQuery.CountAsync();
        var rows = await pickedQuery
            .OrderByDescending(x => x.record.PickedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new MinePlaneRow(
                x.plane.Id,
                x.plane.LocationTag,
                x.plane.Content,
                x.plane.Mood,
                x.plane.CreateTime,
                x.plane.ExpireTime,
                x.plane.PickCount,
                x.plane.LikeCount,
                x.plane.Comments.Count,
                x.plane.RecalledAt,
                null,
                x.record.PickedAt))
            .ToListAsync();

        var items = rows.Select(row => ToMineItemResponse(row, now)).ToList();
        return new MinePlaneListResponse(items, total);
    }

    [HttpGet("admin")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<ActionResult<List<PlaneResponse>>> GetAllAdmin([FromQuery] AdminPlaneQuery request)
    {
        var query = db.Planes.IgnoreQueryFilters().AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Id))
        {
            var normalizedId = request.Id.Trim();
            if (!Guid.TryParse(normalizedId, out var planeId))
            {
                return new List<PlaneResponse>();
            }

            query = query.Where(p => p.Id == planeId);
        }

        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            var keyword = request.Keyword.Trim();
            query = query.Where(p =>
                p.Content.Contains(keyword) ||
                p.LocationTag.Contains(keyword) ||
                (p.AuthorName != null && p.AuthorName.Contains(keyword)));
        }

        if (!string.IsNullOrWhiteSpace(request.Location))
        {
            var location = request.Location.Trim();
            query = query.Where(p => p.LocationTag.Contains(location));
        }

        if (!string.IsNullOrWhiteSpace(request.Mood))
        {
            var mood = request.Mood.Trim();
            query = query.Where(p => p.Mood == mood);
        }

        if (request.CreateTimeStart.HasValue)
        {
            query = query.Where(p => p.CreateTime >= request.CreateTimeStart.Value);
        }

        if (request.CreateTimeEnd.HasValue)
        {
            query = query.Where(p => p.CreateTime <= request.CreateTimeEnd.Value);
        }

        var rows = await query
            .OrderByDescending(p => p.CreateTime)
            .Select(p => new PlaneRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.IsAnonymous,
                p.AuthorName,
                p.ImageUrlsJson,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount,
                p.VoteTitle,
                p.VoteOptionsJson))
            .ToListAsync();

        return rows.Select(ToResponse).ToList();
    }

    [HttpGet("reported")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<ActionResult<List<PlaneResponse>>> GetReported()
    {
        var rows = await db.Planes
            .IgnoreQueryFilters()
            .Where(p => p.ReportCount > 0)
            .OrderByDescending(p => p.ReportCount)
            .Select(p => new PlaneRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.IsAnonymous,
                p.AuthorName,
                p.ImageUrlsJson,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount,
                p.VoteTitle,
                p.VoteOptionsJson))
            .ToListAsync();

        return rows.Select(ToResponse).ToList();
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<ActionResult<PlaneResponse>> Update(Guid id, UpdatePlaneRequest req)
    {
        var plane = await db.Planes
            .IgnoreQueryFilters()
            .Include(p => p.AttitudeVotes)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (plane is null)
            return NotFound(new { message = "纸飞机不存在" });

        var locationTag = (req.LocationTag ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(locationTag))
            return BadRequest(new { message = "地点不能为空" });
        if (locationTag.Length > 50)
            return BadRequest(new { message = "地点不能超过50个字符" });

        var content = (req.Content ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(content))
            return BadRequest(new { message = "正文不能为空" });
        if (content.Length > 200)
            return BadRequest(new { message = "正文不能超过200个字符" });

        var mood = (req.Mood ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(mood))
            return BadRequest(new { message = "情绪不能为空" });
        if (mood.Length > 20)
            return BadRequest(new { message = "情绪不能超过20个字符" });

        if (req.ExpireHours < 1 || req.ExpireHours > 168)
            return BadRequest(new { message = "存活时间需在 1 到 168 小时之间" });
        var expireHours = req.ExpireHours;

        var authorName = req.IsAnonymous ? null : (req.AuthorName ?? string.Empty).Trim();
        if (!req.IsAnonymous)
        {
            if (string.IsNullOrWhiteSpace(authorName))
                return BadRequest(new { message = "实名投递需要昵称" });

            if (authorName.Length > 30)
                return BadRequest(new { message = "昵称不能超过30个字符" });
        }

        var voteOptions = NormalizeVoteOptions(req.VoteOptions);
        if (voteOptions.Any(option => option.Length > 30))
            return BadRequest(new { message = "投票选项不能超过30个字符" });

        var voteTitle = string.IsNullOrWhiteSpace(req.VoteTitle) ? null : req.VoteTitle.Trim();
        if (voteTitle != null && voteTitle.Length > 60)
            return BadRequest(new { message = "投票标题不能超过60个字符" });

        var imageUrls = NormalizeImageUrls(req.ImageUrls);
        if (voteOptions.Count == 1)
            return BadRequest(new { message = "投票至少填写两个选项" });

        if (voteOptions.Count > 0 && voteTitle is null)
            return BadRequest(new { message = "请填写投票标题" });

        if (imageUrls.Count > 9)
            return BadRequest(new { message = "最多上传9张图片" });

        plane.LocationTag = locationTag;
        plane.Content = content;
        plane.Mood = mood;
        plane.IsAnonymous = req.IsAnonymous;
        plane.AuthorName = authorName;
        plane.ImageUrlsJson = imageUrls.Count > 0 ? JsonSerializer.Serialize(imageUrls, VoteJsonOptions) : null;
        plane.VoteTitle = voteTitle;
        plane.VoteOptionsJson = voteOptions.Count > 0 ? JsonSerializer.Serialize(voteOptions, VoteJsonOptions) : null;
        plane.ExpireTime = DateTime.UtcNow.AddHours(expireHours);

        if (voteOptions.Count == 0)
        {
            if (plane.AttitudeVotes.Count > 0)
            {
                db.PlaneAttitudeVotes.RemoveRange(plane.AttitudeVotes);
            }
        }
        else
        {
            var staleVotes = plane.AttitudeVotes
                .Where(v => !voteOptions.Contains(v.OptionKey))
                .ToList();

            if (staleVotes.Count > 0)
            {
                db.PlaneAttitudeVotes.RemoveRange(staleVotes);
            }
        }

        await db.SaveChangesAsync();

        var commentCount = await db.Comments.CountAsync(c => c.PlaneId == id);
        return ToResponse(plane, commentCount);
    }

    [HttpPut("/api/admin/planes/{id:guid}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public Task<ActionResult<PlaneResponse>> UpdateByAdminRoute(Guid id, UpdatePlaneRequest req)
    {
        return Update(id, req);
    }

    [HttpPost("{id}/like")]
    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    public async Task<IActionResult> Like(Guid id)
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var plane = await db.Planes.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (plane is null) return NotFound();

        var exists = await db.PlaneLikeRecords.AnyAsync(r => r.PlaneId == id && r.AppUserId == userId);
        if (exists)
            return Conflict(new { message = "你已经续航过这架纸飞机" });

        var now = DateTime.UtcNow;
        db.PlaneLikeRecords.Add(new PlaneLikeRecord
        {
            Id = Guid.NewGuid(),
            PlaneId = id,
            AppUserId = userId,
            FueledAt = now
        });

        plane.LikeCount++;
        plane.ExpireTime = plane.ExpireTime > now
            ? plane.ExpireTime.AddHours(1)
            : now.AddHours(1);
        await db.SaveChangesAsync();

        return Ok(new { plane.LikeCount, plane.ExpireTime });
    }

    [HttpPost("{id}/report")]
    public async Task<IActionResult> Report(Guid id)
    {
        var plane = await db.Planes.FindAsync(id);
        if (plane is null) return NotFound();

        plane.ReportCount++;
        if (plane.ReportCount >= 3)
            plane.IsDeleted = true;

        await db.SaveChangesAsync();
        return Ok(new { message = "举报已收到" });
    }

    [HttpPost("{id}/recall")]
    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    public async Task<ActionResult<PlaneResponse>> Recall(Guid id)
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var plane = await db.Planes
            .IgnoreQueryFilters()
            .Where(p => !p.IsDeleted && p.Id == id)
            .Select(p => new
            {
                Plane = p,
                CommentCount = p.Comments.Count
            })
            .FirstOrDefaultAsync();

        if (plane is null) return NotFound();
        if (plane.Plane.CreatorUserId != userId) return Forbid();

        var now = DateTime.UtcNow;
        if (plane.Plane.ExpireTime > now)
            plane.Plane.ExpireTime = now;
        plane.Plane.RecalledAt = plane.Plane.RecalledAt ?? now;

        await db.SaveChangesAsync();
        return ToResponse(plane.Plane, plane.CommentCount);
    }

    [HttpPost("{id}/destroy")]
    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    public async Task<IActionResult> Destroy(Guid id)
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var plane = await db.Planes
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);
        if (plane is null) return NotFound();
        if (plane.CreatorUserId != userId) return Forbid();

        plane.IsDeleted = true;
        await db.SaveChangesAsync();

        return Ok(new { message = "纸飞机已销毁" });
    }

    [HttpGet("{id}/attitudes")]
    public async Task<ActionResult<PlaneAttitudeResponse>> GetAttitudes(Guid id, [FromQuery] string? voterKey)
    {
        var plane = await db.Planes
            .Where(p => p.Id == id)
            .Select(p => new { p.Id, p.VoteOptionsJson })
            .FirstOrDefaultAsync();
        if (plane is null) return NotFound();

        var optionKeys = ParseVoteOptions(plane.VoteOptionsJson);
        if (optionKeys.Count == 0)
            return BadRequest(new { message = "当前纸飞机没有投票配置" });

        var votes = await db.PlaneAttitudeVotes
            .Where(v => v.PlaneId == id)
            .ToListAsync();

        return BuildAttitudeResponse(votes, voterKey, optionKeys);
    }

    [HttpPost("{id}/attitudes")]
    public async Task<ActionResult<PlaneAttitudeResponse>> VoteAttitude(Guid id, VotePlaneAttitudeRequest req)
    {
        var plane = await db.Planes
            .Where(p => p.Id == id)
            .Select(p => new { p.Id, p.VoteOptionsJson })
            .FirstOrDefaultAsync();
        if (plane is null) return NotFound();

        var voterKey = (req.VoterKey ?? string.Empty).Trim();
        var optionKey = (req.OptionKey ?? string.Empty).Trim();

        if (string.IsNullOrWhiteSpace(voterKey))
            return BadRequest(new { message = "投票身份不能为空" });

        var optionKeys = ParseVoteOptions(plane.VoteOptionsJson);
        if (optionKeys.Count == 0)
            return BadRequest(new { message = "当前纸飞机没有投票配置" });

        if (!optionKeys.Contains(optionKey))
            return BadRequest(new { message = "投票选项不存在" });

        var vote = await db.PlaneAttitudeVotes
            .FirstOrDefaultAsync(v => v.PlaneId == id && v.VoterKey == voterKey);

        var now = DateTime.UtcNow;
        if (vote is null)
        {
            db.PlaneAttitudeVotes.Add(new PlaneAttitudeVote
            {
                Id = Guid.NewGuid(),
                PlaneId = id,
                VoterKey = voterKey,
                OptionKey = optionKey,
                CreateTime = now,
                UpdateTime = now
            });
        }
        else
        {
            return Conflict(new { message = "你已经投过票了" });
        }

        await db.SaveChangesAsync();

        var votes = await db.PlaneAttitudeVotes
            .Where(v => v.PlaneId == id)
            .ToListAsync();

        return Ok(BuildAttitudeResponse(votes, voterKey, optionKeys));
    }

    [HttpDelete("{id}")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var plane = await db.Planes.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id);
        if (plane is null) return NotFound();

        plane.IsDeleted = true;
        await db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<ActionResult<PlaneResponse>> GetByIdentityAsync(Expression<Func<Plane, bool>> predicate)
    {
        var row = await db.Planes
            .IgnoreQueryFilters()
            .Where(predicate)
            .Select(p => new PlaneRow(
                p.Id,
                p.ShortCode,
                p.LocationTag,
                p.Content,
                p.Mood,
                p.IsAnonymous,
                p.AuthorName,
                p.ImageUrlsJson,
                p.CreateTime,
                p.ExpireTime,
                p.PickCount,
                p.LikeCount,
                p.Comments.Count,
                p.ReportCount,
                p.VoteTitle,
                p.VoteOptionsJson))
            .FirstOrDefaultAsync();
        if (row is null) return NotFound();

        var plane = await db.Planes
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(predicate);
        if (plane is null) return NotFound();

        var canTrackPickup = !plane.IsDeleted && plane.ExpireTime > DateTime.UtcNow;
        if (canTrackPickup)
        {
            plane.PickCount++;
            var appUserId = GetCurrentAppUserIdOrNull();
            if (appUserId.HasValue)
            {
                await UpsertPickRecordAsync(plane.Id, appUserId.Value, DateTime.UtcNow);
            }

            await db.SaveChangesAsync();
        }

        return canTrackPickup
            ? ToResponse(row with { PickCount = row.PickCount + 1 })
            : ToResponse(row);
    }

    private async Task<string> GenerateUniqueShortCodeAsync(int maxAttempts = 30)
    {
        for (var attempt = 0; attempt < maxAttempts; attempt += 1)
        {
            var candidate = CreateShortCodeCandidate();
            var exists = await db.Planes
                .IgnoreQueryFilters()
                .AnyAsync(p => p.ShortCode == candidate);
            if (!exists) return candidate;
        }

        throw new InvalidOperationException("无法生成唯一纸条短号");
    }

    private static string CreateShortCodeCandidate()
    {
        var buffer = RandomNumberGenerator.GetBytes(ShortCodeLength);
        var chars = new char[ShortCodeLength];
        for (var i = 0; i < ShortCodeLength; i += 1)
        {
            chars[i] = ShortCodeAlphabet[buffer[i] % ShortCodeAlphabet.Length];
        }

        return new string(chars);
    }

    private static string? NormalizeShortCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code)) return null;
        var normalized = new string(code
            .Trim()
            .ToUpperInvariant()
            .Where(ch => char.IsLetterOrDigit(ch))
            .ToArray());
        if (normalized.StartsWith("PP") && normalized.Length == ShortCodeLength + 2)
        {
            normalized = normalized[2..];
        }
        if (normalized.Length != ShortCodeLength) return null;
        return normalized.All(ch => ShortCodeAlphabet.Contains(ch)) ? normalized : null;
    }

    private static bool IsShortCodeUniqueConflict(DbUpdateException exception)
    {
        return exception.InnerException is SqlException sqlException
               && sqlException.Number is 2601 or 2627;
    }

    private static PlaneResponse ToResponse(Plane p, int commentCount) =>
        new(
            p.Id,
            p.ShortCode,
            p.LocationTag,
            p.Content,
            p.Mood,
            p.IsAnonymous,
            p.AuthorName,
            ParseStringList(p.ImageUrlsJson),
            p.CreateTime,
            p.ExpireTime,
            p.PickCount,
            p.LikeCount,
            commentCount,
            p.ReportCount,
            p.VoteTitle,
            ParseVoteOptions(p.VoteOptionsJson));

    private static PlaneResponse ToResponse(PlaneRow row) =>
        new(
            row.Id,
            row.ShortCode,
            row.LocationTag,
            row.Content,
            row.Mood,
            row.IsAnonymous,
            row.AuthorName,
            ParseStringList(row.ImageUrlsJson),
            row.CreateTime,
            row.ExpireTime,
            row.PickCount,
            row.LikeCount,
            row.CommentCount,
            row.ReportCount,
            row.VoteTitle,
            ParseVoteOptions(row.VoteOptionsJson));

    private static PlaneAttitudeResponse BuildAttitudeResponse(List<PlaneAttitudeVote> votes, string? voterKey, List<string> optionKeys)
    {
        var normalizedVoterKey = (voterKey ?? string.Empty).Trim();
        var options = optionKeys
            .Select(optionKey => new PlaneAttitudeOptionResponse(
                optionKey,
                votes.Count(v => v.OptionKey == optionKey)
            ))
            .ToList();

        var myChoice = votes
            .FirstOrDefault(v => v.VoterKey == normalizedVoterKey)
            ?.OptionKey;

        return new PlaneAttitudeResponse(options, myChoice, votes.Count);
    }

    private MinePlaneItemResponse ToMineItemResponse(MinePlaneRow row, DateTime now)
    {
        var status = ResolveStatus(row.RecalledAt, row.ExpireTime, now);
        return new MinePlaneItemResponse(
            row.Id,
            row.LocationTag,
            row.Content,
            row.Mood,
            row.CreateTime,
            row.ExpireTime,
            row.PickCount,
            row.LikeCount,
            row.CommentCount,
            status,
            row.RecalledAt != null,
            row.FueledAt,
            row.PickedAt);
    }

    private static string ResolveStatus(DateTime? recalledAt, DateTime expireTime, DateTime now)
    {
        if (recalledAt != null) return "recalled";
        return expireTime > now ? "active" : "expired";
    }

    private async Task UpsertPickRecordAsync(Guid planeId, Guid userId, DateTime pickedAt)
    {
        var record = await db.PlanePickRecords.FirstOrDefaultAsync(r => r.PlaneId == planeId && r.AppUserId == userId);
        if (record is null)
        {
            db.PlanePickRecords.Add(new PlanePickRecord
            {
                Id = Guid.NewGuid(),
                PlaneId = planeId,
                AppUserId = userId,
                PickedAt = pickedAt
            });
            return;
        }

        record.PickedAt = pickedAt;
    }

    private Guid? GetCurrentAppUserIdOrNull()
    {
        if (User.Identity?.IsAuthenticated != true) return null;
        if (!User.HasTokenUse(AuthTokenUses.AppUser)) return null;
        return User.TryGetSubjectId(out var userId) ? userId : null;
    }

    private bool CanAccessRandomCandidates()
    {
        if (User.Identity?.IsAuthenticated == true && User.HasTokenUse(AuthTokenUses.Admin))
        {
            return true;
        }

        var remoteIp = HttpContext.Connection.RemoteIpAddress;
        if (remoteIp is null)
        {
            return false;
        }

        if (IPAddress.IsLoopback(remoteIp))
        {
            return true;
        }

        return remoteIp.IsIPv4MappedToIPv6 && IPAddress.IsLoopback(remoteIp.MapToIPv4());
    }

    private static string? NormalizeStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status)) return "all";
        var normalized = status.Trim().ToLowerInvariant();
        return normalized is "all" or "active" or "recalled" or "expired" ? normalized : null;
    }

    private static List<string> NormalizeVoteOptions(List<string>? options)
    {
        return (options ?? [])
            .Select(item => item?.Trim() ?? string.Empty)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.Ordinal)
            .Take(4)
            .ToList();
    }

    private static List<string> NormalizeImageUrls(List<string>? imageUrls)
    {
        return (imageUrls ?? [])
            .Select(item => item?.Trim() ?? string.Empty)
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(9)
            .ToList();
    }

    private static List<string> ParseVoteOptions(string? json)
    {
        return ParseStringList(json);
    }

    private static List<string> ParseStringList(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
            return [];

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json, VoteJsonOptions) ?? [];
        }
        catch
        {
            return [];
        }
    }

    private record PlaneRow(
        Guid Id,
        string ShortCode,
        string LocationTag,
        string Content,
        string Mood,
        bool IsAnonymous,
        string? AuthorName,
        string? ImageUrlsJson,
        DateTime CreateTime,
        DateTime ExpireTime,
        int PickCount,
        int LikeCount,
        int CommentCount,
        int ReportCount,
        string? VoteTitle,
        string? VoteOptionsJson);

    private record RandomCandidateRow(
        Guid Id,
        string ShortCode,
        string LocationTag,
        string Content,
        string Mood,
        DateTime CreateTime,
        DateTime ExpireTime,
        DateTime? RecalledAt,
        int PickCount,
        int LikeCount,
        int CommentCount,
        int ReportCount);

    private record MinePlaneRow(
        Guid Id,
        string LocationTag,
        string Content,
        string Mood,
        DateTime CreateTime,
        DateTime ExpireTime,
        int PickCount,
        int LikeCount,
        int CommentCount,
        DateTime? RecalledAt,
        DateTime? FueledAt,
        DateTime? PickedAt);
}


