namespace server.Models;

public class AdminUser
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public string Roles { get; set; } = "R_SUPER";
    public bool IsActive { get; set; } = true;
    public DateTime CreateTime { get; set; }
    public DateTime? LastLoginTime { get; set; }

    public List<AdminRefreshToken> RefreshTokens { get; set; } = [];
}
