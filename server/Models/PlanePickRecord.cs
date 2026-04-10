namespace server.Models;

public class PlanePickRecord
{
    public Guid Id { get; set; }
    public Guid PlaneId { get; set; }
    public Guid AppUserId { get; set; }
    public DateTime PickedAt { get; set; }

    public Plane Plane { get; set; } = null!;
    public AppUser AppUser { get; set; } = null!;
}
