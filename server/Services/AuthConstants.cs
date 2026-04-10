namespace server.Services;

public static class AuthClaimTypes
{
    public const string TokenUse = "token_use";
}

public static class AuthTokenUses
{
    public const string Admin = "admin";
    public const string AppUser = "app_user";
}

public static class AuthPolicies
{
    public const string AdminOnly = "AdminOnly";
    public const string AppUserOnly = "AppUserOnly";
}
