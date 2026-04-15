using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace server.Services;

public class MoodSettingsService(IConfiguration configuration, IWebHostEnvironment environment)
{
    private const int MaxMoodCount = 20;
    private const string DefaultIconUrl = "/static/images/\u60c5\u7eea.png";
    private const string DefaultColor = "#909399";

    private static readonly Regex MoodKeyPattern = new("^[a-z0-9][a-z0-9_-]{0,31}$", RegexOptions.Compiled);
    private static readonly Regex ColorPattern = new("^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$", RegexOptions.Compiled);

    private static readonly JsonSerializerOptions JsonWriteOptions = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
    };

    private static readonly List<MoodSettingItem> DefaultMoods =
    [
        new() { Key = "happy", Label = "\u5f00\u5fc3", IconUrl = DefaultIconUrl, Color = "#ff7b7b", SortOrder = 10, IsActive = true, IsCustom = false },
        new() { Key = "sad", Label = "\u96be\u8fc7", IconUrl = DefaultIconUrl, Color = "#6aa7ff", SortOrder = 20, IsActive = true, IsCustom = false },
        new() { Key = "calm", Label = "\u5e73\u9759", IconUrl = DefaultIconUrl, Color = "#36b37e", SortOrder = 30, IsActive = true, IsCustom = false },
        new() { Key = "angry", Label = "\u5410\u69fd", IconUrl = DefaultIconUrl, Color = "#ff9f1c", SortOrder = 40, IsActive = true, IsCustom = false },
        new() { Key = "love", Label = "\u5fc3\u52a8", IconUrl = DefaultIconUrl, Color = "#ff6fb1", SortOrder = 50, IsActive = true, IsCustom = false },
        new() { Key = "custom", Label = "\u81ea\u5b9a\u4e49\u5fc3\u60c5", IconUrl = DefaultIconUrl, Color = "#7d8b8a", SortOrder = 90, IsActive = true, IsCustom = true }
    ];

    public List<MoodSettingItem> GetAll()
    {
        var configured = configuration.GetSection("Mood:Items").Get<List<MoodSettingItem>>() ?? [];
        return SanitizeItems(configured);
    }

    public List<MoodSettingItem> GetActive()
    {
        return GetAll().Where(item => item.IsActive).ToList();
    }

    public async Task<List<MoodSettingItem>> UpdateAsync(
        IEnumerable<MoodSettingItem>? moods,
        CancellationToken cancellationToken = default)
    {
        var sanitized = SanitizeItems(moods);
        if (!sanitized.Any(item => item.IsActive))
        {
            throw new InvalidOperationException("\u81f3\u5c11\u9700\u8981\u4fdd\u7559\u4e00\u4e2a\u542f\u7528\u7684\u60c5\u7eea\u9879\u3002");
        }

        var configPaths = ResolveWritableConfigPaths();
        if (configPaths.Count == 0)
        {
            throw new FileNotFoundException("\u672a\u627e\u5230\u53ef\u5199\u5165\u7684 appsettings.json \u914d\u7f6e\u6587\u4ef6\u3002");
        }

        foreach (var configPath in configPaths)
        {
            await WriteMoodsToConfigAsync(configPath, sanitized, cancellationToken);
        }

        return sanitized;
    }

    private static List<MoodSettingItem> SanitizeItems(IEnumerable<MoodSettingItem>? moods)
    {
        var source = moods?.ToList() ?? [];
        if (source.Count == 0)
        {
            source = CloneItems(DefaultMoods);
        }

        var result = new List<MoodSettingItem>();
        var uniqueKeys = new HashSet<string>(StringComparer.Ordinal);

        foreach (var raw in source)
        {
            if (raw is null) continue;

            var key = NormalizeKey(raw.Key);
            if (string.IsNullOrWhiteSpace(key) || !uniqueKeys.Add(key))
            {
                continue;
            }

            var label = NormalizeLabel(raw.Label);
            if (string.IsNullOrWhiteSpace(label))
            {
                continue;
            }

            result.Add(new MoodSettingItem
            {
                Key = key,
                Label = label,
                IconUrl = NormalizeIconUrl(raw.IconUrl),
                Color = NormalizeColor(raw.Color),
                SortOrder = Math.Clamp(raw.SortOrder, -999, 9999),
                IsActive = raw.IsActive,
                IsCustom = raw.IsCustom
            });

            if (result.Count >= MaxMoodCount)
            {
                break;
            }
        }

        if (result.Count == 0)
        {
            result = CloneItems(DefaultMoods);
        }

        NormalizeCustomMood(result);

        return result
            .OrderBy(item => item.SortOrder)
            .ThenBy(item => item.Key, StringComparer.Ordinal)
            .ToList();
    }

    private static void NormalizeCustomMood(List<MoodSettingItem> items)
    {
        var customItem = items.FirstOrDefault(item => string.Equals(item.Key, "custom", StringComparison.Ordinal));
        if (customItem is null)
        {
            var sortOrder = items.Count == 0 ? 90 : items.Max(item => item.SortOrder) + 10;
            customItem = new MoodSettingItem
            {
                Key = "custom",
                Label = "\u81ea\u5b9a\u4e49\u5fc3\u60c5",
                IconUrl = DefaultIconUrl,
                Color = "#7d8b8a",
                SortOrder = sortOrder,
                IsActive = true,
                IsCustom = true
            };
            items.Add(customItem);
        }

        foreach (var item in items)
        {
            item.IsCustom = false;
        }

        // "custom" is a fixed option: users choose it, then type their own mood text.
        customItem.Key = "custom";
        customItem.Label = "\u81ea\u5b9a\u4e49\u5fc3\u60c5";
        customItem.IsActive = true;
        customItem.IsCustom = true;
    }

    private static string NormalizeKey(string? key)
    {
        var value = (key ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        if (!MoodKeyPattern.IsMatch(value)) return string.Empty;
        return value;
    }

    private static string NormalizeLabel(string? label)
    {
        var value = (label ?? string.Empty).Trim();
        if (value.Length > 20)
        {
            value = value[..20];
        }
        return value;
    }

    private static string NormalizeIconUrl(string? iconUrl)
    {
        var value = (iconUrl ?? string.Empty).Trim();
        return string.IsNullOrWhiteSpace(value) ? DefaultIconUrl : value;
    }

    private static string NormalizeColor(string? color)
    {
        var value = (color ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value)) return DefaultColor;
        return ColorPattern.IsMatch(value) ? value : DefaultColor;
    }

    private static List<MoodSettingItem> CloneItems(IEnumerable<MoodSettingItem> source)
    {
        return source.Select(item => new MoodSettingItem
        {
            Key = item.Key,
            Label = item.Label,
            IconUrl = item.IconUrl,
            Color = item.Color,
            SortOrder = item.SortOrder,
            IsActive = item.IsActive,
            IsCustom = item.IsCustom
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

    private static async Task WriteMoodsToConfigAsync(
        string configPath,
        IReadOnlyCollection<MoodSettingItem> moods,
        CancellationToken cancellationToken)
    {
        var rawJson = await File.ReadAllTextAsync(configPath, cancellationToken);
        var rootNode = JsonNode.Parse(rawJson) as JsonObject;

        if (rootNode is null)
        {
            throw new InvalidDataException($"\u914d\u7f6e\u6587\u4ef6\u683c\u5f0f\u65e0\u6548\uff1a{configPath}");
        }

        var moodNode = rootNode["Mood"] as JsonObject ?? new JsonObject();
        rootNode["Mood"] = moodNode;

        var moodArray = new JsonArray();
        foreach (var mood in moods)
        {
            moodArray.Add(new JsonObject
            {
                ["Key"] = mood.Key,
                ["Label"] = mood.Label,
                ["IconUrl"] = mood.IconUrl,
                ["Color"] = mood.Color,
                ["SortOrder"] = mood.SortOrder,
                ["IsActive"] = mood.IsActive,
                ["IsCustom"] = mood.IsCustom
            });
        }

        moodNode["Items"] = moodArray;

        var updatedJson = rootNode.ToJsonString(JsonWriteOptions);
        await File.WriteAllTextAsync(configPath, $"{updatedJson}{Environment.NewLine}", cancellationToken);
    }
}

public class MoodSettingItem
{
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string IconUrl { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsCustom { get; set; }
}
