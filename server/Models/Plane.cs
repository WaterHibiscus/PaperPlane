namespace server.Models;

public class Plane
{
    public Guid Id { get; set; }
    public Guid? CreatorUserId { get; set; }
    public string LocationTag { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Mood { get; set; } = string.Empty;
    public bool IsAnonymous { get; set; } = true;
    public string? AuthorName { get; set; }
    public string? ImageUrlsJson { get; set; }
    public string? VoteTitle { get; set; }
    public string? VoteOptionsJson { get; set; }
    public DateTime CreateTime { get; set; }
    public DateTime ExpireTime { get; set; }
    public DateTime? RecalledAt { get; set; }
    public int PickCount { get; set; }
    public bool IsDeleted { get; set; }
    public int ReportCount { get; set; }
    public int LikeCount { get; set; }

    public AppUser? CreatorUser { get; set; }
    public List<Comment> Comments { get; set; } = [];
    public List<PlaneAttitudeVote> AttitudeVotes { get; set; } = [];
    public List<PlaneLikeRecord> LikeRecords { get; set; } = [];
    public List<PlanePickRecord> PickRecords { get; set; } = [];
}
