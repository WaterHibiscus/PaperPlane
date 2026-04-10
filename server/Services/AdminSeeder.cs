using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Services;

public static class AdminSeeder
{
    public static async Task SeedAsync(AppDbContext db, PasswordHasher hasher, AdminSeedOptions options)
    {
        var userName = string.IsNullOrWhiteSpace(options.UserName) ? "admin" : options.UserName.Trim();
        var displayName = string.IsNullOrWhiteSpace(options.DisplayName) ? userName : options.DisplayName.Trim();
        var password = string.IsNullOrWhiteSpace(options.Password) ? "admin123" : options.Password;
        var roles = string.IsNullOrWhiteSpace(options.Roles) ? "R_SUPER" : options.Roles.Trim();

        var (hash, salt) = hasher.HashPassword(password);
        var adminUser = await db.AdminUsers.FirstOrDefaultAsync(u => u.UserName == userName);

        if (adminUser is null)
        {
            adminUser = new AdminUser
            {
                Id = Guid.NewGuid(),
                UserName = userName,
                DisplayName = displayName,
                PasswordHash = hash,
                PasswordSalt = salt,
                Roles = roles,
                IsActive = true,
                CreateTime = DateTime.UtcNow
            };

            db.AdminUsers.Add(adminUser);
        }
        else
        {
            adminUser.DisplayName = displayName;
            adminUser.PasswordHash = hash;
            adminUser.PasswordSalt = salt;
            adminUser.Roles = roles;
            adminUser.IsActive = true;

            var refreshTokens = db.AdminRefreshTokens.Where(t => t.AdminUserId == adminUser.Id);
            db.AdminRefreshTokens.RemoveRange(refreshTokens);
        }

        await db.SaveChangesAsync();
    }
}
