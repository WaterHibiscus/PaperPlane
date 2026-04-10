namespace server.Services;

public class JwtOptions
{
    public string Key { get; set; } = string.Empty;
    public string Issuer { get; set; } = "PaperPlane";
    public string Audience { get; set; } = "PaperPlane.Admin";
    public int AccessTokenMinutes { get; set; } = 60;
    public int RefreshTokenDays { get; set; } = 7;
}

public class AdminSeedOptions
{
    public string UserName { get; set; } = "admin";
    public string DisplayName { get; set; } = "admin";
    public string Password { get; set; } = "admin123";
    public string Roles { get; set; } = "R_SUPER";
}
