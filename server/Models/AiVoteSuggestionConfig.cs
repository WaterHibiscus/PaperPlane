namespace server.Models;

public class AiVoteSuggestionConfig
{
    public int Id { get; set; }
    public bool IsEnabled { get; set; }
    public string BaseUrl { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string? ApiKey { get; set; }
    public string SystemPrompt { get; set; } = string.Empty;
    public decimal Temperature { get; set; }
    public int MaxTokens { get; set; }
    public int DefaultOptionCount { get; set; }
    public int TimeoutSeconds { get; set; }
    public bool EnableFallback { get; set; }
    public int PerUserMinuteLimit { get; set; }
    public DateTime UpdateTime { get; set; }
    public string? UpdatedBy { get; set; }
}
