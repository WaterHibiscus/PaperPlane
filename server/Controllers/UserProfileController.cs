using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Services;

namespace server.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AppUserOnly)]
[Route("api/users/me")]
public class UserProfileController(AppDbContext db, IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileResponse>> GetProfile()
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();

        return new UserProfileResponse(
            user.Username,
            user.AvatarUrl,
            NormalizeGender(user.Gender),
            user.Bio ?? string.Empty);
    }

    [HttpPut("profile")]
    public async Task<ActionResult<UserProfileResponse>> UpdateProfile(UpdateUserProfileRequest req)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();

        var username = (req.Username ?? string.Empty).Trim();
        var avatarUrl = (req.AvatarUrl ?? string.Empty).Trim();
        var gender = (req.Gender ?? string.Empty).Trim().ToLowerInvariant();
        var bio = (req.Bio ?? string.Empty).Trim();

        if (username.Length is < 1 or > 12)
            return BadRequest(new { message = "用户名长度需在1到12之间" });
        if (!IsValidGender(gender))
            return BadRequest(new { message = "性别仅支持 male、female、secret" });
        if (bio.Length > 200)
            return BadRequest(new { message = "个人简介不能超过200字" });

        user.Username = username;
        user.AvatarUrl = string.IsNullOrWhiteSpace(avatarUrl) ? null : avatarUrl;
        user.Gender = gender;
        user.Bio = bio;

        await db.SaveChangesAsync();

        return new UserProfileResponse(user.Username, user.AvatarUrl, user.Gender, user.Bio);
    }

    [HttpPost("avatar")]
    public async Task<ActionResult<UploadAvatarResponse>> UploadAvatar([FromForm] IFormFile? file)
    {
        var user = await GetCurrentUserAsync();
        if (user is null) return Unauthorized();

        if (file is null || file.Length == 0)
            return BadRequest(new { message = "请选择头像图片" });

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = "仅支持 jpg、png、webp、gif 图片" });

        var webRoot = env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(env.ContentRootPath, "wwwroot");
        }

        var uploadDir = Path.Combine(webRoot, "uploads", "avatars");
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var savePath = Path.Combine(uploadDir, fileName);
        await using (var stream = System.IO.File.Create(savePath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/avatars/{fileName}";
        user.AvatarUrl = url;
        await db.SaveChangesAsync();

        return Ok(new UploadAvatarResponse(url));
    }

    private async Task<server.Models.AppUser?> GetCurrentUserAsync()
    {
        if (!User.TryGetSubjectId(out var userId))
            return null;

        return await db.AppUsers.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
    }

    private static bool IsValidGender(string gender)
    {
        return gender is "male" or "female" or "secret";
    }

    private static string NormalizeGender(string? gender)
    {
        var value = (gender ?? string.Empty).Trim().ToLowerInvariant();
        return IsValidGender(value) ? value : "secret";
    }
}
