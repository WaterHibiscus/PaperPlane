using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.DTOs;
using server.Models;
using server.Services;

namespace server.Controllers;

[ApiController]
[Route("api/user-auth")]
public class UserAuthController(
    AppDbContext db,
    PasswordHasher hasher,
    JwtTokenService tokenService,
    CaptchaService captchaService) : ControllerBase
{
    private static readonly Regex StudentIdRegex = new("^[A-Za-z0-9]{6,20}$", RegexOptions.Compiled);
    private static readonly Regex PhoneRegex = new("^1\\d{10}$", RegexOptions.Compiled);

    [HttpGet("captcha")]
    public ActionResult<CaptchaResponse> GetCaptcha()
    {
        var (captchaId, captchaImage, expiresIn) = captchaService.CreateCaptcha();
        return new CaptchaResponse(captchaId, captchaImage, expiresIn);
    }

    [HttpPost("register")]
    public async Task<ActionResult<RegisterUserResponse>> Register(RegisterUserRequest req)
    {
        var username = NormalizeText(req.Username);
        var studentId = NormalizeStudentId(req.StudentId);
        var phone = NormalizePhone(req.Phone);
        var password = NormalizeText(req.Password);

        if (!captchaService.ValidateCaptcha(req.CaptchaId, req.CaptchaCode))
            return BadRequest(new { message = "图形验证码错误或已过期" });

        if (username.Length is < 1 or > 12)
            return BadRequest(new { message = "用户名长度需在1到12之间" });
        if (!StudentIdRegex.IsMatch(studentId))
            return BadRequest(new { message = "学号需为6到20位字母或数字" });
        if (!PhoneRegex.IsMatch(phone))
            return BadRequest(new { message = "手机号格式不正确" });
        if (password.Length < 6)
            return BadRequest(new { message = "密码长度至少6位" });

        if (await db.AppUsers.AnyAsync(u => u.StudentId == studentId))
            return Conflict(new { message = "该学号已注册" });
        if (await db.AppUsers.AnyAsync(u => u.Phone == phone))
            return Conflict(new { message = "该手机号已注册" });

        var (hash, salt) = hasher.HashPassword(password);
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            Username = username,
            StudentId = studentId,
            Phone = phone,
            PasswordHash = hash,
            PasswordSalt = salt,
            AvatarUrl = null,
            Gender = "secret",
            Bio = string.Empty,
            IsActive = true,
            CreateTime = DateTime.UtcNow
        };

        db.AppUsers.Add(user);
        await db.SaveChangesAsync();

        return Ok(new RegisterUserResponse(user.Id, user.Username, user.Phone, user.StudentId));
    }

    [HttpPost("login")]
    public async Task<ActionResult<UserLoginResponse>> Login(UserLoginRequest req)
    {
        var credential = NormalizeText(req.Credential);
        var password = NormalizeText(req.Password);
        if (string.IsNullOrWhiteSpace(credential) || string.IsNullOrWhiteSpace(password))
            return BadRequest(new { message = "账号和密码不能为空" });

        if (!captchaService.ValidateCaptcha(req.CaptchaId, req.CaptchaCode))
            return BadRequest(new { message = "图形验证码错误或已过期" });

        var normalizedPhone = NormalizePhone(credential);
        var normalizedStudentId = NormalizeStudentId(credential);

        var user = await db.AppUsers.FirstOrDefaultAsync(u =>
            u.IsActive && (u.Phone == normalizedPhone || u.StudentId == normalizedStudentId));

        if (user is null || !hasher.Verify(password, user.PasswordHash, user.PasswordSalt))
            return Unauthorized(new { message = "账号或密码错误" });

        var now = DateTime.UtcNow;
        var accessToken = tokenService.CreateAccessToken(user);
        var refreshTokenValue = tokenService.GenerateRefreshToken();

        db.UserRefreshTokens.Add(new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            AppUserId = user.Id,
            Token = refreshTokenValue,
            CreatedAt = now,
            ExpiresAt = now.Add(tokenService.GetRefreshTokenLifetime()),
            CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString()
        });

        user.LastLoginTime = now;
        await db.SaveChangesAsync();

        return BuildLoginResponse(user, accessToken, refreshTokenValue);
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<UserLoginResponse>> RefreshToken(RefreshUserTokenRequest req)
    {
        var refreshToken = NormalizeText(req.RefreshToken);
        if (string.IsNullOrWhiteSpace(refreshToken))
            return BadRequest(new { message = "refreshToken不能为空" });

        var token = await db.UserRefreshTokens
            .Include(t => t.AppUser)
            .FirstOrDefaultAsync(t => t.Token == refreshToken);

        if (token is null || token.RevokedAt != null || token.ExpiresAt <= DateTime.UtcNow)
            return Unauthorized(new { message = "refreshToken无效或已过期" });

        if (!token.AppUser.IsActive)
            return Unauthorized(new { message = "账号已不可用" });

        var now = DateTime.UtcNow;
        var newRefreshToken = tokenService.GenerateRefreshToken();
        token.RevokedAt = now;
        token.ReplacedByToken = newRefreshToken;

        db.UserRefreshTokens.Add(new UserRefreshToken
        {
            Id = Guid.NewGuid(),
            AppUserId = token.AppUserId,
            Token = newRefreshToken,
            CreatedAt = now,
            ExpiresAt = now.Add(tokenService.GetRefreshTokenLifetime()),
            CreatedByIp = HttpContext.Connection.RemoteIpAddress?.ToString()
        });

        var newAccessToken = tokenService.CreateAccessToken(token.AppUser);
        await db.SaveChangesAsync();

        return BuildLoginResponse(token.AppUser, newAccessToken, newRefreshToken);
    }

    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    [HttpGet("me")]
    public async Task<ActionResult<AppUserInfoResponse>> Me()
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var user = await db.AppUsers.FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);
        if (user is null) return Unauthorized();

        return ToUserInfo(user);
    }

    [Authorize(Policy = AuthPolicies.AppUserOnly)]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout([FromBody] LogoutUserRequest? req = null)
    {
        if (!User.TryGetSubjectId(out var userId))
            return Unauthorized();

        var now = DateTime.UtcNow;
        var refreshToken = NormalizeText(req?.RefreshToken ?? string.Empty);

        if (!string.IsNullOrWhiteSpace(refreshToken))
        {
            var token = await db.UserRefreshTokens.FirstOrDefaultAsync(t =>
                t.AppUserId == userId && t.Token == refreshToken && t.RevokedAt == null);

            if (token != null)
            {
                token.RevokedAt = now;
            }
        }
        else
        {
            var activeTokens = await db.UserRefreshTokens
                .Where(t => t.AppUserId == userId && t.RevokedAt == null && t.ExpiresAt > now)
                .ToListAsync();

            foreach (var token in activeTokens)
            {
                token.RevokedAt = now;
            }
        }

        await db.SaveChangesAsync();
        return Ok(new { message = "退出成功" });
    }

    private UserLoginResponse BuildLoginResponse(AppUser user, string accessToken, string refreshToken)
    {
        return new UserLoginResponse(
            accessToken,
            refreshToken,
            tokenService.GetAccessTokenExpiresInSeconds(),
            ToUserInfo(user));
    }

    private static AppUserInfoResponse ToUserInfo(AppUser user)
    {
        return new AppUserInfoResponse(
            user.Id,
            user.Username,
            user.AvatarUrl,
            string.IsNullOrWhiteSpace(user.Gender) ? "secret" : user.Gender,
            user.Bio ?? string.Empty);
    }

    private static string NormalizeText(string value) => (value ?? string.Empty).Trim();

    private static string NormalizePhone(string value)
    {
        return new string((value ?? string.Empty).Where(ch => !char.IsWhiteSpace(ch)).ToArray());
    }

    private static string NormalizeStudentId(string value)
    {
        var compact = new string((value ?? string.Empty).Where(ch => !char.IsWhiteSpace(ch)).ToArray());
        return compact.ToUpperInvariant();
    }
}
