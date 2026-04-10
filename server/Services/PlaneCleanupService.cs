using Microsoft.EntityFrameworkCore;
using server.Data;

namespace server.Services;

public class PlaneCleanupService(IServiceProvider serviceProvider, ILogger<PlaneCleanupService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = serviceProvider.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var now = DateTime.UtcNow;
                var expired = await db.Planes
                    .IgnoreQueryFilters()
                    .Where(p => !p.IsDeleted && p.ExpireTime < now)
                    .ToListAsync(stoppingToken);

                if (expired.Count > 0)
                {
                    foreach (var plane in expired)
                        plane.IsDeleted = true;

                    await db.SaveChangesAsync(stoppingToken);
                    logger.LogInformation("Cleaned up {Count} expired planes", expired.Count);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error cleaning up expired planes");
            }

            await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
        }
    }
}
