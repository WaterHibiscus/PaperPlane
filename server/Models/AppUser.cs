namespace server.Models;

public class AppUser
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Gender { get; set; } = "secret";
    public string Bio { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreateTime { get; set; }
    public DateTime? LastLoginTime { get; set; }

    public List<UserRefreshToken> RefreshTokens { get; set; } = [];
    public List<Plane> CreatedPlanes { get; set; } = [];
    public List<PlaneLikeRecord> LikeRecords { get; set; } = [];
    public List<PlanePickRecord> PickRecords { get; set; } = [];
}
