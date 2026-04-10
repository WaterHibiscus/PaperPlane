namespace server.Models;

public class PlaneLikeRecord
{
    public Guid Id { get; set; }
    public Guid PlaneId { get; set; }
    public Guid AppUserId { get; set; }
    public DateTime FueledAt { get; set; }

    public Plane Plane { get; set; } = null!;
    public AppUser AppUser { get; set; } = null!;
}
