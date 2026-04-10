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
        ".jpg", ".jpeg", ".png", ".webp", ".gif"
    };

    [HttpPost("images")]
    public Task<ActionResult<object>> UploadImage([FromForm] IFormFile? file)
    {
        return UploadToDir(file, "planes", "请选择图片", "仅支持 jpg、png、webp、gif 图片");
    }

    [HttpPost("location-icons")]
    [Authorize(Policy = AuthPolicies.AdminOnly)]
    public Task<ActionResult<object>> UploadLocationIcon([FromForm] IFormFile? file)
    {
        return UploadToDir(file, "location-icons", "请选择地点图标", "仅支持 jpg、png、webp、gif 图标");
    }

    private async Task<ActionResult<object>> UploadToDir(
        IFormFile? file,
        string dirName,
        string emptyMessage,
        string extensionMessage)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = emptyMessage });

        var extension = Path.GetExtension(file.FileName);
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
}
