using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace server.Services;

public static class UserClaimsExtensions
{
    public static bool TryGetSubjectId(this ClaimsPrincipal principal, out Guid userId)
    {
        userId = Guid.Empty;
        var userIdValue = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                          ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(userIdValue, out userId);
    }

    public static bool HasTokenUse(this ClaimsPrincipal principal, string tokenUse)
    {
        var value = principal.FindFirstValue(AuthClaimTypes.TokenUse);
        return string.Equals(value, tokenUse, StringComparison.Ordinal);
    }
}
