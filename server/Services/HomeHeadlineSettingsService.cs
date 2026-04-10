using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace server.Services;

public class HomeHeadlineSettingsService(IConfiguration configuration, IWebHostEnvironment environment)
{
    private const int MaxPhraseCount = 12;

    private static readonly JsonSerializerOptions JsonWriteOptions = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static readonly string[] DefaultHeadlines =
    [
        "把心绪折成纸，交给校园的风",
        "把没说出口的话，留在路过的风景",
        "让匿名的回声，刚好落进谁手里",
        "把今天的情绪，投向一个真实地点",
        "给某个陌生同学，留下一次轻回应"
    ];

    public List<string> GetCurrentPhrases()
    {
        var configured = configuration.GetSection("Home:HeadlinePhrases").Get<string[]>() ?? [];
        var phrases = SanitizePhrases(configured);

        return phrases.Count > 0 ? phrases : [.. DefaultHeadlines];
    }

    public async Task<List<string>> UpdateAsync(IEnumerable<string?>? phrases, CancellationToken cancellationToken = default)
    {
        var sanitized = SanitizePhrases(phrases);
        if (sanitized.Count == 0)
        {
            throw new InvalidOperationException("至少保留一条首页轮动文案。");
        }

        var configPaths = ResolveWritableConfigPaths();
        if (configPaths.Count == 0)
        {
            throw new FileNotFoundException("未找到可写入的 appsettings.json 配置文件。");
        }

        foreach (var configPath in configPaths)
        {
            await WritePhrasesToConfigAsync(configPath, sanitized, cancellationToken);
        }

        return sanitized;
    }

    private static List<string> SanitizePhrases(IEnumerable<string?>? phrases)
    {
        return (phrases ?? [])
            .Select(item => (item ?? string.Empty).Trim())
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Distinct(StringComparer.Ordinal)
            .Take(MaxPhraseCount)
            .ToList();
    }

    private List<string> ResolveWritableConfigPaths()
    {
        var paths = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        AddConfigPath(paths, Path.Combine(environment.ContentRootPath, "appsettings.json"));
        AddConfigPath(paths, Path.Combine(AppContext.BaseDirectory, "appsettings.json"));

        var projectRoot = FindProjectRoot();
        if (!string.IsNullOrWhiteSpace(projectRoot))
        {
            AddConfigPath(paths, Path.Combine(projectRoot, "appsettings.json"));
        }

        return [.. paths];
    }

    private static void AddConfigPath(ISet<string> paths, string configPath)
    {
        if (string.IsNullOrWhiteSpace(configPath) || !File.Exists(configPath))
        {
            return;
        }

        paths.Add(Path.GetFullPath(configPath));
    }

    private string? FindProjectRoot()
    {
        var searchRoots = new[]
        {
            environment.ContentRootPath,
            AppContext.BaseDirectory
        };

        foreach (var searchRoot in searchRoots)
        {
            if (string.IsNullOrWhiteSpace(searchRoot))
            {
                continue;
            }

            var current = new DirectoryInfo(searchRoot);
            while (current is not null)
            {
                if (File.Exists(Path.Combine(current.FullName, "server.csproj")))
                {
                    return current.FullName;
                }

                current = current.Parent;
            }
        }

        return null;
    }

    private static async Task WritePhrasesToConfigAsync(
        string configPath,
        IReadOnlyCollection<string> phrases,
        CancellationToken cancellationToken)
    {
        var rawJson = await File.ReadAllTextAsync(configPath, cancellationToken);
        var rootNode = JsonNode.Parse(rawJson) as JsonObject;

        if (rootNode is null)
        {
            throw new InvalidDataException($"配置文件格式无效：{configPath}");
        }

        var homeNode = rootNode["Home"] as JsonObject ?? new JsonObject();
        rootNode["Home"] = homeNode;

        var phraseArray = new JsonArray();
        foreach (var phrase in phrases)
        {
            phraseArray.Add(phrase);
        }

        homeNode["HeadlinePhrases"] = phraseArray;

        var updatedJson = rootNode.ToJsonString(JsonWriteOptions);
        await File.WriteAllTextAsync(configPath, $"{updatedJson}{Environment.NewLine}", cancellationToken);
    }
}
