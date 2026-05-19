namespace server.Models;

public class PlaneReportRecord
{
    public Guid Id { get; set; }
    public Guid PlaneId { get; set; }
    public Guid? AppUserId { get; set; }
    public string ReportReason { get; set; } = string.Empty;
    public string? ReportDetail { get; set; }
    public DateTime ReportedAt { get; set; }

    public Plane Plane { get; set; } = null!;
    public AppUser? AppUser { get; set; }
}
