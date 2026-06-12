namespace server.Models;

public class AiSensitiveWordSuggestion
{
    public int Id { get; set; }
    public string SuggestedWord { get; set; } = string.Empty;
    public string NormalizedWord { get; set; } = string.Empty;
    public string Category { get; set; } = "GENERAL";
    public string MatchMode { get; set; } = "CONTAINS";
    public string HandleMode { get; set; } = "BLOCK";
    public string? ReplaceText { get; set; }
    public string Scope { get; set; } = "PLANE";
    public int Severity { get; set; } = 4;
    public int Priority { get; set; } = 120;
    public string? Remark { get; set; }
    public string SourceTextPreview { get; set; } = string.Empty;
    public string? Reason { get; set; }
    public decimal? Confidence { get; set; }
    public string? RawResponse { get; set; }
    public DateTime CreateTime { get; set; }
}
