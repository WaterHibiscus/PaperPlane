using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.FileProviders;
using Microsoft.AspNetCore.Http.Features;
using server.Data;
using server.Services;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = null;
});
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = long.MaxValue;
    options.ValueLengthLimit = int.MaxValue;
    options.MultipartHeadersLengthLimit = int.MaxValue;
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddMemoryCache();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("Default")));

builder.Services.AddSingleton<ContentFilterService>();
builder.Services.AddSingleton<HomeHeadlineSettingsService>();
builder.Services.AddSingleton<MoodSettingsService>();
builder.Services.AddSingleton<ExpireOptionSettingsService>();
builder.Services.AddSingleton<PlaneQrCodeService>();
builder.Services.AddSingleton<PasswordHasher>();
builder.Services.AddSingleton<JwtTokenService>();
builder.Services.AddSingleton<CaptchaService>();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<AdminSeedOptions>(builder.Configuration.GetSection("AdminSeed"));

var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Key)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.AdminOnly, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim(AuthClaimTypes.TokenUse, AuthTokenUses.Admin);
    });

    options.AddPolicy(AuthPolicies.AppUserOnly, policy =>
    {
        policy.RequireAuthenticatedUser();
        policy.RequireClaim(AuthClaimTypes.TokenUse, AuthTokenUses.AppUser);
    });
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();

var webRoot = app.Environment.WebRootPath;
if (string.IsNullOrWhiteSpace(webRoot))
{
    webRoot = Path.Combine(app.Environment.ContentRootPath, "wwwroot");
}
Directory.CreateDirectory(webRoot);
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "planes"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "avatars"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "location-icons"));
Directory.CreateDirectory(Path.Combine(webRoot, "uploads", "mood-icons"));

// Migrate legacy uploaded images from previous verify/build directories into current web root.
void SyncLegacyUploads(string targetDir, params string[] legacyDirs)
{
    Directory.CreateDirectory(targetDir);
    foreach (var legacyDir in legacyDirs.Where(Directory.Exists))
    {
        foreach (var legacyFile in Directory.EnumerateFiles(legacyDir))
        {
            var fileName = Path.GetFileName(legacyFile);
            if (string.IsNullOrWhiteSpace(fileName))
            {
                continue;
            }

            var targetPath = Path.Combine(targetDir, fileName);
            if (!System.IO.File.Exists(targetPath))
            {
                System.IO.File.Copy(legacyFile, targetPath, overwrite: false);
            }
        }
    }
}

var uploadsPlaneDir = Path.Combine(webRoot, "uploads", "planes");
var uploadsAvatarDir = Path.Combine(webRoot, "uploads", "avatars");
var uploadsLocationIconDir = Path.Combine(webRoot, "uploads", "location-icons");
var uploadsMoodIconDir = Path.Combine(webRoot, "uploads", "mood-icons");

SyncLegacyUploads(
    uploadsPlaneDir,
    Path.Combine(app.Environment.ContentRootPath, "obj", "codex_verify_build_images", "wwwroot", "uploads", "planes"),
    Path.Combine(app.Environment.ContentRootPath, "obj", "verify_build", "wwwroot", "uploads", "planes"),
    Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "planes")
);
SyncLegacyUploads(
    uploadsAvatarDir,
    Path.Combine(app.Environment.ContentRootPath, "obj", "codex_verify_build_images", "wwwroot", "uploads", "avatars"),
    Path.Combine(app.Environment.ContentRootPath, "obj", "verify_build", "wwwroot", "uploads", "avatars"),
    Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "avatars")
);
SyncLegacyUploads(
    uploadsLocationIconDir,
    Path.Combine(app.Environment.ContentRootPath, "obj", "codex_verify_build_images", "wwwroot", "uploads", "location-icons"),
    Path.Combine(app.Environment.ContentRootPath, "obj", "verify_build", "wwwroot", "uploads", "location-icons"),
    Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "location-icons")
);
SyncLegacyUploads(
    uploadsMoodIconDir,
    Path.Combine(app.Environment.ContentRootPath, "obj", "codex_verify_build_images", "wwwroot", "uploads", "mood-icons"),
    Path.Combine(app.Environment.ContentRootPath, "obj", "verify_build", "wwwroot", "uploads", "mood-icons"),
    Path.Combine(AppContext.BaseDirectory, "wwwroot", "uploads", "mood-icons")
);

// Auto-migrate on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var hasher = scope.ServiceProvider.GetRequiredService<PasswordHasher>();
    var adminSeed = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Options.IOptions<AdminSeedOptions>>().Value;
    db.Database.Migrate();
    await AdminSeeder.SeedAsync(db, hasher, adminSeed);
}

app.UseSwagger();
app.UseSwaggerUI();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(webRoot),
    RequestPath = "",
    OnPrepareResponse = ctx =>
    {
        // Uploaded assets use GUID file names, so they are safe to cache aggressively.
        const int cacheSeconds = 60 * 60 * 24 * 30;
        ctx.Context.Response.Headers.CacheControl = $"public,max-age={cacheSeconds}";
    }
});
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
