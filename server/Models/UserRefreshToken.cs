namespace server.Models;

public class UserRefreshToken
{
    public Guid Id { get; set; }
    public Guid AppUserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? RevokedAt { get; set; }
    public string? ReplacedByToken { get; set; }
    public string? CreatedByIp { get; set; }

    public AppUser AppUser { get; set; } = null!;
}
