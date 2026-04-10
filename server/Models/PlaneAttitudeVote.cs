namespace server.Models;

public class PlaneAttitudeVote
{
    public Guid Id { get; set; }
    public Guid PlaneId { get; set; }
    public string VoterKey { get; set; } = string.Empty;
    public string OptionKey { get; set; } = string.Empty;
    public DateTime CreateTime { get; set; }
    public DateTime UpdateTime { get; set; }

    public Plane Plane { get; set; } = null!;
}
