namespace server.Services;

public class ContentFilterService
{
    private static readonly string[] BannedWords =
    [
        "违禁词1", "违禁词2" // 实际部署时替换为真实敏感词库
    ];

    public (bool passed, string? reason) Check(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            return (false, "内容不能为空");

        if (content.Length > 200)
            return (false, "内容不能超过200字");

        foreach (var word in BannedWords)
        {
            if (content.Contains(word, StringComparison.OrdinalIgnoreCase))
                return (false, "内容包含敏感词，请修改后重试");
        }

        return (true, null);
    }
}
