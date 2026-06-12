namespace server.Services;

public static class PublicAssetUrlNormalizer
{
    public static string? NormalizeNullable(string? url)
    {
        var normalized = Normalize(url);
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    public static string Normalize(string? url)
    {
        var value = (url ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(value))
        {
            return string.Empty;
        }

        if (value.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase) ||
            value.StartsWith("/static/", StringComparison.OrdinalIgnoreCase))
        {
            return value;
        }

        if (value.StartsWith("uploads/", StringComparison.OrdinalIgnoreCase) ||
            value.StartsWith("static/", StringComparison.OrdinalIgnoreCase))
        {
            return "/" + value;
        }

        if (!Uri.TryCreate(value, UriKind.Absolute, out var absoluteUri))
        {
            return value;
        }

        var scheme = absoluteUri.Scheme;
        if (!scheme.Equals(Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
            !scheme.Equals(Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return value;
        }

        var pathAndQuery = absoluteUri.PathAndQuery;
        if (pathAndQuery.StartsWith("/uploads/", StringComparison.OrdinalIgnoreCase) ||
            pathAndQuery.StartsWith("/static/", StringComparison.OrdinalIgnoreCase))
        {
            return pathAndQuery;
        }

        if (absoluteUri.IsLoopback || IsLoopbackHost(absoluteUri.Host))
        {
            return pathAndQuery;
        }

        return value;
    }

    private static bool IsLoopbackHost(string host)
    {
        if (string.IsNullOrWhiteSpace(host))
        {
            return false;
        }

        return host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
               host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase);
    }
}
