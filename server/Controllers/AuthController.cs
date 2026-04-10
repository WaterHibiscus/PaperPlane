using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(
    AppDbContext db,
    PasswordHasher hasher,
    JwtTokenService tokenService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginTokenResponse>> Login(LoginRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.UserName) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "用户名或密码不能为空" });

        var normalized = req.UserName.Trim().ToLowerInvariant();
        var user = await db.AdminUsers.FirstOrDefaultAsync(u => u.IsActive && u.UserName.ToLower() == normalized);
        if (user is null || !hasher.Verify(req.Password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized(new { message = "用户名或密码错误" });

        var accessToken = tokenService.CreateAccessToken(user);
        var refreshTokenValue = tokenService.GenerateRefreshToken();
        var now = DateTime.UtcNow;

        var refreshToken = new AdminRefreshToken
        {
            Id = Guid.NewGuid(),
            AdminUserId = user.Id,
            Token = refreshTokenValue,
            CreatedAt = now,
            ExpiresAt = now.Add(tokenService.GetRefreshTokenLifetime()),
            CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString()
        };

        db.AdminRefreshTokens.Add(refreshToken);
        user.LastLoginTime = now;
        await db.SaveChangesAsync();

        return new LoginTokenResponse(accessToken, refreshTokenValue);
    }

    [Authorize(Policy = AuthPolicies.AdminOnly)]
    [HttpGet("getUserInfo")]
    public async Task<ActionResult<UserInfoResponse>> GetUserInfo()
    {
        var userIdValue = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
                         ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(userIdValue, out var userId))
            return Unauthorized();

        var user = await db.AdminUsers.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        if (user is null) return Unauthorized();

        var roles = (user.Roles ?? string.Empty)
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .ToList();

        return new UserInfoResponse(
            user.Id.ToString(),
            string.IsNullOrWhiteSpace(user.DisplayName) ? user.UserName : user.DisplayName,
            roles,
            new List<string>()
        );
    }

    [HttpPost("refreshToken")]
    public async Task<ActionResult<LoginTokenResponse>> RefreshToken(RefreshTokenRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken))
            return BadRequest(new { message = "refreshToken不能为空" });

        var token = await db.AdminRefreshTokens
            .Include(t => t.AdminUser)
            .FirstOrDefaultAsync(t => t.Token == req.RefreshToken);

        if (token is null || token.RevokedAt != null || token.ExpiresAt <= DateTime.UtcNow)
            return Unauthorized(new { message = "refreshToken无效或已过期" });

        if (!token.AdminUser.IsActive)
            return Unauthorized();

        var now = DateTime.UtcNow;
        var newRefreshTokenValue = tokenService.GenerateRefreshToken();

        token.RevokedAt = now;
        token.ReplacedByToken = newRefreshTokenValue;

        db.AdminRefreshTokens.Add(new AdminRefreshToken
        {
            Id = Guid.NewGuid(),
            AdminUserId = token.AdminUserId,
            Token = newRefreshTokenValue,
            CreatedAt = now,
            ExpiresAt = now.Add(tokenService.GetRefreshTokenLifetime()),
            CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString()
        });

        var newAccessToken = tokenService.CreateAccessToken(token.AdminUser);

        await db.SaveChangesAsync();

        return new LoginTokenResponse(newAccessToken, newRefreshTokenValue);
    }

    [HttpGet("error")]
    public IActionResult Error([FromQuery] string code, [FromQuery] string msg)
    {
        return BadRequest(new { code, msg });
    }
}
