using System.Text;
using Microsoft.Extensions.Caching.Memory;

namespace server.Services;

public sealed class CaptchaService(IMemoryCache cache)
{
    private const string CaptchaChars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static readonly TimeSpan CaptchaLifetime = TimeSpan.FromMinutes(2);
    private const string CachePrefix = "captcha:";

    public (string CaptchaId, string CaptchaImage, int ExpiresIn) CreateCaptcha()
    {
        var captchaId = Guid.NewGuid().ToString("N");
        var code = GenerateCode(4);
        cache.Set(
            GetCacheKey(captchaId),
            code,
            new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = CaptchaLifetime
            });

        var image = BuildSvgDataUrl(code);
        return (captchaId, image, (int)CaptchaLifetime.TotalSeconds);
    }

    public bool ValidateCaptcha(string? captchaId, string? captchaCode)
    {
        if (string.IsNullOrWhiteSpace(captchaId) || string.IsNullOrWhiteSpace(captchaCode))
            return false;

        var normalizedId = captchaId.Trim();
        if (!cache.TryGetValue<string>(GetCacheKey(normalizedId), out var expectedCode))
            return false;

        var actualCode = captchaCode.Trim().ToUpperInvariant();
        var matched = string.Equals(expectedCode, actualCode, StringComparison.Ordinal);

        if (matched)
        {
            cache.Remove(GetCacheKey(normalizedId));
        }

        return matched;
    }

    private static string GetCacheKey(string captchaId)
    {
        return CachePrefix + captchaId;
    }

    private static string GenerateCode(int length)
    {
        var chars = new char[length];
        for (var i = 0; i < length; i++)
        {
            var index = Random.Shared.Next(0, CaptchaChars.Length);
            chars[i] = CaptchaChars[index];
        }

        return new string(chars);
    }

    private static string BuildSvgDataUrl(string code)
    {
        const int width = 120;
        const int height = 44;

        var lineBuilder = new StringBuilder();
        for (var i = 0; i < 5; i++)
        {
            var x1 = Random.Shared.Next(0, width);
            var y1 = Random.Shared.Next(0, height);
            var x2 = Random.Shared.Next(0, width);
            var y2 = Random.Shared.Next(0, height);
            var color = RandomColor(0.2f);
            lineBuilder.Append(
                $"<line x1='{x1}' y1='{y1}' x2='{x2}' y2='{y2}' stroke='{color}' stroke-width='1' />");
        }

        var textBuilder = new StringBuilder();
        for (var i = 0; i < code.Length; i++)
        {
            var x = 18 + i * 24;
            var y = 30 + Random.Shared.Next(-3, 4);
            var rotate = Random.Shared.Next(-25, 26);
            var fill = RandomColor(0.85f);
            textBuilder.Append(
                $"<text x='{x}' y='{y}' transform='rotate({rotate} {x} {y})' fill='{fill}' font-size='24' font-family='Arial, sans-serif' font-weight='700'>{code[i]}</text>");
        }

        var noiseBuilder = new StringBuilder();
        for (var i = 0; i < 40; i++)
        {
            var cx = Random.Shared.Next(0, width);
            var cy = Random.Shared.Next(0, height);
            var r = Random.Shared.Next(1, 3);
            var fill = RandomColor(0.15f);
            noiseBuilder.Append($"<circle cx='{cx}' cy='{cy}' r='{r}' fill='{fill}' />");
        }

        var svg =
            $"<svg xmlns='http://www.w3.org/2000/svg' width='{width}' height='{height}' viewBox='0 0 {width} {height}'>" +
            "<defs><linearGradient id='bg' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#f6f9ff'/><stop offset='100%' stop-color='#f2fff7'/></linearGradient></defs>" +
            $"<rect width='{width}' height='{height}' rx='8' ry='8' fill='url(#bg)' />" +
            noiseBuilder +
            lineBuilder +
            textBuilder +
            "</svg>";

        var bytes = Encoding.UTF8.GetBytes(svg);
        var base64 = Convert.ToBase64String(bytes);
        return $"data:image/svg+xml;base64,{base64}";
    }

    private static string RandomColor(float alpha)
    {
        var r = Random.Shared.Next(30, 180);
        var g = Random.Shared.Next(30, 180);
        var b = Random.Shared.Next(30, 180);
        return $"rgba({r},{g},{b},{alpha:0.##})";
    }
}
