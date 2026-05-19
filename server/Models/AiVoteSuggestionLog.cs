namespace server.Models;

public class AiVoteSuggestionLog
{
    public long Id { get; set; }
    public Guid RequestId { get; set; }
    public Guid? AppUserId { get; set; }
    public string ContentPreview { get; set; } = string.Empty;
    public string Mood { get; set; } = string.Empty;
    public string LocationTag { get; set; } = string.Empty;
    public int RequestedOptionCount { get; set; }
    public string? GeneratedTitle { get; set; }
    public string? GeneratedOptionsJson { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? ErrorMessage { get; set; }
    public string? RawResponse { get; set; }
    public int DurationMs { get; set; }
    public DateTime CreateTime { get; set; }
}
