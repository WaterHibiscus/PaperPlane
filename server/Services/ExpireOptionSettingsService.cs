using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace server.Services;

public class ExpireOptionSettingsService(IConfiguration configuration, IWebHostEnvironment environment)
{
    private const int MaxOptionCount = 12;

    private static readonly JsonSerializerOptions JsonWriteOptions = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static readonly List<ExpireOptionItem> DefaultOptions =
    [
        new() { Hours = 2, Label = "2小时", SortOrder = 10, IsActive = true },
        new() { Hours = 24, Label = "24小时", SortOrder = 20, IsActive = true },
        new() { Hours = 48, Label = "48小时", SortOrder = 30, IsActive = true }
    ];

    public List<ExpireOptionItem> GetAll()
    {
        var configured = configuration.GetSection("Throw:ExpireOptions").Get<List<ExpireOptionItem>>() ?? [];
        return SanitizeItems(configured);
    }

    public List<ExpireOptionItem> GetActive()
    {
        return GetAll().Where(item => item.IsActive).ToList();
    }

    public async Task<List<ExpireOptionItem>> UpdateAsync(
        IEnumerable<ExpireOptionItem>? options,
        CancellationToken cancellationToken = default)
    {
        var sanitized = SanitizeItems(options);
        if (!sanitized.Any(item => item.IsActive))
        {
            throw new InvalidOperationException("至少需要保留一个启用的存活时间选项。");
        }

        var configPaths = ResolveWritableConfigPaths();
        if (configPaths.Count == 0)
        {
            throw new FileNotFoundException("未找到可写入的 appsettings.json 配置文件。");
        }

        foreach (var configPath in configPaths)
        {
            await WriteOptionsToConfigAsync(configPath, sanitized, cancellationToken);
        }

        return sanitized;
    }

    private static List<ExpireOptionItem> SanitizeItems(IEnumerable<ExpireOptionItem>? options)
    {
        var source = options?.ToList() ?? [];
        if (source.Count == 0)
        {
            source = CloneItems(DefaultOptions);
        }

        var result = new List<ExpireOptionItem>();
        var uniqueHours = new HashSet<int>();

        foreach (var raw in source)
        {
            if (raw is null)
            {
                continue;
            }

            var hours = Math.Clamp(raw.Hours, 1, 168);
            if (!uniqueHours.Add(hours))
            {
                continue;
            }

            var label = string.IsNullOrWhiteSpace(raw.Label) ? $"{hours}小时" : raw.Label.Trim();
            if (label.Length > 20)
            {
                label = label[..20];
            }

            result.Add(new ExpireOptionItem
            {
                Hours = hours,
                Label = label,
                SortOrder = Math.Clamp(raw.SortOrder, -999, 9999),
                IsActive = raw.IsActive
            });

            if (result.Count >= MaxOptionCount)
            {
                break;
            }
        }

        if (result.Count == 0)
        {
            result = CloneItems(DefaultOptions);
        }

        return result
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Hours)
            .ToList();
    }

    private static List<ExpireOptionItem> CloneItems(IEnumerable<ExpireOptionItem> source)
    {
        return source.Select(item => new ExpireOptionItem
        {
            Hours = item.Hours,
            Label = item.Label,
            SortOrder = item.SortOrder,
            IsActive = item.IsActive
        }).ToList();
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

    private static async Task WriteOptionsToConfigAsync(
        string configPath,
        IReadOnlyCollection<ExpireOptionItem> options,
        CancellationToken cancellationToken)
    {
        var rawJson = await File.ReadAllTextAsync(configPath, cancellationToken);
        var rootNode = JsonNode.Parse(rawJson) as JsonObject;

        if (rootNode is null)
        {
            throw new InvalidDataException($"配置文件格式无效：{configPath}");
        }

        var throwNode = rootNode["Throw"] as JsonObject ?? new JsonObject();
        rootNode["Throw"] = throwNode;

        var optionArray = new JsonArray();
        foreach (var option in options)
        {
            optionArray.Add(new JsonObject
            {
                ["Hours"] = option.Hours,
                ["Label"] = option.Label,
                ["SortOrder"] = option.SortOrder,
                ["IsActive"] = option.IsActive
            });
        }

        throwNode["ExpireOptions"] = optionArray;

        var updatedJson = rootNode.ToJsonString(JsonWriteOptions);
        await File.WriteAllTextAsync(configPath, $"{updatedJson}{Environment.NewLine}", cancellationToken);
    }
}

public class ExpireOptionItem
{
    public int Hours { get; set; }
    public string Label { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
