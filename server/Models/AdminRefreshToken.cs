namespace server.Models;

public class AdminRefreshToken
{
    public Guid Id { get; set; }
    public Guid AdminUserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByToken { get; set; }
    public string? CreatedByIp { get; set; }

    public AdminUser AdminUser { get; set; } = null!;
}
