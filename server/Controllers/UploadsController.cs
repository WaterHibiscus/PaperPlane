using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/uploads")]
public class UploadsController(IWebHostEnvironment env) : ControllerBase
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".ico", ".bmp", ".jfif"
    };

    private static readonly Dictionary<string, string> ContentTypeExtensionMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["image/jpeg"] = ".jpg",
        ["image/png"] = ".png",
        ["image/webp"] = ".webp",
        ["image/gif"] = ".gif",
        ["image/svg+xml"] = ".svg",
        ["image/x-icon"] = ".ico",
        ["image/vnd.microsoft.icon"] = ".ico",
        ["image/bmp"] = ".bmp"
    };

    [HttpPost("images")]
    public Task<ActionResult<object>> UploadImage([FromForm] IFormFile? file)
    {
        return UploadToDir(file, "planes", "\u8bf7\u9009\u62e9\u56fe\u7247", "\u4ec5\u652f\u6301 jpg\u3001png\u3001webp\u3001gif \u56fe\u7247");
    }

    [HttpPost("location-icons")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public Task<ActionResult<object>> UploadLocationIcon([FromForm] IFormFile? file)
    {
        return UploadToDir(file, "location-icons", "\u8bf7\u9009\u62e9\u5730\u70b9\u56fe\u6807", "\u4ec5\u652f\u6301 jpg\u3001png\u3001webp\u3001gif \u56fe\u6807");
    }

    [HttpPost("mood-icons")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public Task<ActionResult<object>> UploadMoodIcon([FromForm] IFormFile? file)
    {
        return UploadToDir(file, "mood-icons", "\u8bf7\u9009\u62e9\u60c5\u7eea\u56fe\u6807", "\u4ec5\u652f\u6301 jpg\u3001png\u3001webp\u3001gif \u56fe\u6807");
    }

    private async Task<ActionResult<object>> UploadToDir(
        IFormFile? file,
        string dirName,
        string emptyMessage,
        string extensionMessage)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = emptyMessage });

        var extension = ResolveSafeImageExtension(file);
        if (!AllowedExtensions.Contains(extension))
            return BadRequest(new { message = extensionMessage });

        var webRoot = env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(env.ContentRootPath, "wwwroot");
        }

        var uploadDir = Path.Combine(webRoot, "uploads", dirName);
        Directory.CreateDirectory(uploadDir);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var savePath = Path.Combine(uploadDir, fileName);

        await using (var stream = System.IO.File.Create(savePath))
        {
            await file.CopyToAsync(stream);
        }

        var url = $"/uploads/{dirName}/{fileName}";
        return Ok(new { url });
    }

    private static string ResolveSafeImageExtension(IFormFile file)
    {
        var extension = Path.GetExtension(file.FileName);
        if (!string.IsNullOrWhiteSpace(extension))
        {
            return extension.ToLowerInvariant();
        }

        var contentType = file.ContentType ?? string.Empty;
        if (ContentTypeExtensionMap.TryGetValue(contentType, out var mappedExtension))
        {
            return mappedExtension;
        }

        return string.Empty;
    }
}
