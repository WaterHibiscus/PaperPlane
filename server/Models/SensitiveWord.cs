namespace server.Models;

public class SensitiveWord
{
    public Guid Id { get; set; }
    public string Word { get; set; } = string.Empty;
    public string NormalizedWord { get; set; } = string.Empty;
    public string Category { get; set; } = "GENERAL";
    public string MatchMode { get; set; } = "CONTAINS";
    public string HandleMode { get; set; } = "BLOCK";
    public string? ReplaceText { get; set; }
    public string Scope { get; set; } = "PLANE,COMMENT,NICKNAME";
    public int Severity { get; set; } = 3;
    public int Priority { get; set; } = 100;
    public bool IsEnabled { get; set; } = true;
    public string? Remark { get; set; }
    public Guid? CreateAdminId { get; set; }
    public Guid? UpdateAdminId { get; set; }
    public DateTime CreateTime { get; set; }
    public DateTime UpdateTime { get; set; }
}
