using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Plane> Planes => Set<Plane>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<PlaneAttitudeVote> PlaneAttitudeVotes => Set<PlaneAttitudeVote>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<AdminUser> AdminUsers => Set<AdminUser>();
    public DbSet<AdminRefreshToken> AdminRefreshTokens => Set<AdminRefreshToken>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<UserRefreshToken> UserRefreshTokens => Set<UserRefreshToken>();
    public DbSet<PlaneLikeRecord> PlaneLikeRecords => Set<PlaneLikeRecord>();
    public DbSet<PlanePickRecord> PlanePickRecords => Set<PlanePickRecord>();
    public DbSet<PlaneReportRecord> PlaneReportRecords => Set<PlaneReportRecord>();
    public DbSet<SensitiveWord> SensitiveWords => Set<SensitiveWord>();
    public DbSet<AiSensitiveWordSuggestion> AiSensitiveWordSuggestions => Set<AiSensitiveWordSuggestion>();
    public DbSet<AiVoteSuggestionConfig> AiVoteSuggestionConfigs => Set<AiVoteSuggestionConfig>();
    public DbSet<AiVoteSuggestionLog> AiVoteSuggestionLogs => Set<AiVoteSuggestionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Plane>(e =>
        {
            e.ToTable("Planes", tb => tb.HasComment("纸飞机信息表"));
            e.HasKey(p => p.Id);
            e.Property(p => p.ShortCode).HasMaxLength(10).IsRequired();
            e.Property(p => p.Content).HasMaxLength(200).IsRequired();
            e.Property(p => p.LocationTag).HasMaxLength(50).IsRequired();
            e.Property(p => p.Mood).HasMaxLength(20);
            e.Property(p => p.AuthorName).HasMaxLength(30);
            e.Property(p => p.ImageUrlsJson).HasColumnType("nvarchar(max)");
            e.Property(p => p.VoteTitle).HasMaxLength(60);
            e.Property(p => p.VoteOptionsJson).HasColumnType("nvarchar(max)");
            e.HasIndex(p => p.ShortCode).IsUnique();
            e.HasIndex(p => p.CreatorUserId);
            e.HasIndex(p => p.LocationTag);
            e.HasIndex(p => p.ExpireTime);
            e.HasOne(p => p.CreatorUser)
                .WithMany(u => u.CreatedPlanes)
                .HasForeignKey(p => p.CreatorUserId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasQueryFilter(p => !p.IsDeleted);
        });

        modelBuilder.Entity<Comment>(e =>
        {
            e.ToTable("Comments", tb => tb.HasComment("纸飞机评论表"));
            e.HasKey(c => c.Id);
            e.Property(c => c.Reply).HasMaxLength(200).IsRequired();
            e.Property(c => c.NickName).HasMaxLength(30).IsRequired();
            e.HasIndex(c => c.ParentCommentId);
            e.HasOne(c => c.Plane)
                .WithMany(p => p.Comments)
                .HasForeignKey(c => c.PlaneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(c => c.ParentComment)
                .WithMany(c => c.Replies)
                .HasForeignKey(c => c.ParentCommentId)
                .OnDelete(DeleteBehavior.NoAction);
            e.HasQueryFilter(c => !c.Plane.IsDeleted);
        });

        modelBuilder.Entity<PlaneAttitudeVote>(e =>
        {
            e.ToTable("PlaneAttitudeVotes", tb => tb.HasComment("纸飞机态度投票表"));
            e.HasKey(v => v.Id);
            e.Property(v => v.VoterKey).HasMaxLength(100).IsRequired();
            e.Property(v => v.OptionKey).HasMaxLength(30).IsRequired();
            e.HasIndex(v => new { v.PlaneId, v.VoterKey }).IsUnique();
            e.HasOne(v => v.Plane)
                .WithMany(p => p.AttitudeVotes)
                .HasForeignKey(v => v.PlaneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(v => !v.Plane.IsDeleted);
        });

        modelBuilder.Entity<Location>(e =>
        {
            e.ToTable("Locations", tb => tb.HasComment("地点配置表"));
            e.HasKey(l => l.Id);
            e.Property(l => l.Name).HasMaxLength(50).IsRequired();
            e.Property(l => l.IconUrl).HasMaxLength(500);
            e.HasData(
                new Location { Id = 1, Name = "图书馆", SortOrder = 1, IsActive = true, CreateTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 2, Name = "食堂", SortOrder = 2, IsActive = true, CreateTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 3, Name = "操场", SortOrder = 3, IsActive = true, CreateTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 4, Name = "教学楼", SortOrder = 4, IsActive = true, CreateTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 5, Name = "宿舍楼", SortOrder = 5, IsActive = true, CreateTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Location { Id = 6, Name = "校门口", SortOrder = 6, IsActive = true, CreateTime = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        });

        modelBuilder.Entity<AdminUser>(e =>
        {
            e.ToTable("AdminUsers", tb => tb.HasComment("后台管理员表"));
            e.HasKey(u => u.Id);
            e.Property(u => u.UserName).HasMaxLength(50).IsRequired();
            e.Property(u => u.DisplayName).HasMaxLength(50).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(u => u.PasswordSalt).HasMaxLength(200).IsRequired();
            e.Property(u => u.Roles).HasMaxLength(200).IsRequired();
            e.HasIndex(u => u.UserName).IsUnique();
        });

        modelBuilder.Entity<AdminRefreshToken>(e =>
        {
            e.ToTable("AdminRefreshTokens", tb => tb.HasComment("后台刷新令牌表"));
            e.HasKey(t => t.Id);
            e.Property(t => t.Token).HasMaxLength(200).IsRequired();
            e.Property(t => t.CreatedByIp).HasMaxLength(45);
            e.Property(t => t.ReplacedByToken).HasMaxLength(200);
            e.HasIndex(t => t.Token).IsUnique();
            e.HasOne(t => t.AdminUser)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(t => t.AdminUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AppUser>(e =>
        {
            e.ToTable("AppUsers", tb => tb.HasComment("用户端账号表"));
            e.HasKey(u => u.Id);
            e.Property(u => u.Username).HasMaxLength(12).IsRequired();
            e.Property(u => u.StudentId).HasMaxLength(20).IsRequired();
            e.Property(u => u.Phone).HasMaxLength(20).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(200).IsRequired();
            e.Property(u => u.PasswordSalt).HasMaxLength(200).IsRequired();
            e.Property(u => u.AvatarUrl).HasMaxLength(500);
            e.Property(u => u.Gender).HasMaxLength(10).IsRequired();
            e.Property(u => u.Bio).HasMaxLength(200).IsRequired();
            e.HasIndex(u => u.Phone).IsUnique();
            e.HasIndex(u => u.StudentId).IsUnique();
        });

        modelBuilder.Entity<UserRefreshToken>(e =>
        {
            e.ToTable("UserRefreshTokens", tb => tb.HasComment("用户刷新令牌表"));
            e.HasKey(t => t.Id);
            e.Property(t => t.Token).HasMaxLength(200).IsRequired();
            e.Property(t => t.CreatedByIp).HasMaxLength(45);
            e.Property(t => t.ReplacedByToken).HasMaxLength(200);
            e.HasIndex(t => t.Token).IsUnique();
            e.HasOne(t => t.AppUser)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(t => t.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlaneLikeRecord>(e =>
        {
            e.ToTable("PlaneLikeRecords", tb => tb.HasComment("续航记录表"));
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.PlaneId, r.AppUserId }).IsUnique();
            e.HasIndex(r => r.AppUserId);
            e.HasOne(r => r.Plane)
                .WithMany(p => p.LikeRecords)
                .HasForeignKey(r => r.PlaneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.AppUser)
                .WithMany(u => u.LikeRecords)
                .HasForeignKey(r => r.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(r => !r.Plane.IsDeleted);
        });

        modelBuilder.Entity<PlanePickRecord>(e =>
        {
            e.ToTable("PlanePickRecords", tb => tb.HasComment("拾取记录表"));
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.PlaneId, r.AppUserId }).IsUnique();
            e.HasIndex(r => r.AppUserId);
            e.HasOne(r => r.Plane)
                .WithMany(p => p.PickRecords)
                .HasForeignKey(r => r.PlaneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.AppUser)
                .WithMany(u => u.PickRecords)
                .HasForeignKey(r => r.AppUserId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasQueryFilter(r => !r.Plane.IsDeleted);
        });

        modelBuilder.Entity<PlaneReportRecord>(e =>
        {
            e.ToTable("PlaneReportRecords", tb => tb.HasComment("举报记录表"));
            e.HasKey(r => r.Id);
            e.Property(r => r.ReportReason).HasMaxLength(50).IsRequired();
            e.Property(r => r.ReportDetail).HasMaxLength(200);
            e.HasIndex(r => r.PlaneId);
            e.HasIndex(r => r.AppUserId);
            e.HasOne(r => r.Plane)
                .WithMany(p => p.ReportRecords)
                .HasForeignKey(r => r.PlaneId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(r => r.AppUser)
                .WithMany(u => u.ReportRecords)
                .HasForeignKey(r => r.AppUserId)
                .OnDelete(DeleteBehavior.SetNull);
            e.HasIndex(r => new { r.PlaneId, r.AppUserId })
                .IsUnique()
                .HasFilter("[AppUserId] IS NOT NULL");
        });

        modelBuilder.Entity<SensitiveWord>(e =>
        {
            e.ToTable("SensitiveWords", tb => tb.HasComment("敏感词库表"));
            e.HasKey(x => x.Id);
            e.Property(x => x.Word).HasMaxLength(100).IsRequired();
            e.Property(x => x.NormalizedWord).HasMaxLength(100).IsRequired();
            e.Property(x => x.Category).HasMaxLength(30).IsRequired();
            e.Property(x => x.MatchMode).HasMaxLength(20).IsRequired();
            e.Property(x => x.HandleMode).HasMaxLength(20).IsRequired();
            e.Property(x => x.ReplaceText).HasMaxLength(50);
            e.Property(x => x.Scope).HasMaxLength(50).IsRequired();
            e.Property(x => x.Remark).HasMaxLength(200);
            e.HasIndex(x => x.NormalizedWord).IsUnique();
            e.HasIndex(x => new { x.IsEnabled, x.Priority });
            e.HasIndex(x => x.Category);
        });

        modelBuilder.Entity<AiSensitiveWordSuggestion>(e =>
        {
            e.ToTable("AiSensitiveWordSuggestions", tb => tb.HasComment("AI待采纳敏感词记录表"));
            e.HasKey(x => x.Id);
            e.Property(x => x.SuggestedWord).HasMaxLength(100).IsRequired();
            e.Property(x => x.NormalizedWord).HasMaxLength(100).IsRequired();
            e.Property(x => x.Category).HasMaxLength(30).IsRequired();
            e.Property(x => x.MatchMode).HasMaxLength(20).IsRequired();
            e.Property(x => x.HandleMode).HasMaxLength(20).IsRequired();
            e.Property(x => x.ReplaceText).HasMaxLength(50);
            e.Property(x => x.Scope).HasMaxLength(50).IsRequired();
            e.Property(x => x.Remark).HasMaxLength(200);
            e.Property(x => x.SourceTextPreview).HasMaxLength(200).IsRequired();
            e.Property(x => x.Reason).HasMaxLength(500);
            e.Property(x => x.RawResponse).HasMaxLength(4000);
            e.Property(x => x.Confidence).HasPrecision(5, 4);
            e.HasIndex(x => new { x.NormalizedWord, x.Scope }).IsUnique();
            e.HasIndex(x => x.CreateTime);
        });

        modelBuilder.Entity<AiVoteSuggestionConfig>(e =>
        {
            e.ToTable("AiVoteSuggestionConfigs", tb => tb.HasComment("AI投票建议配置表"));
            e.HasKey(c => c.Id);
            e.Property(c => c.BaseUrl).HasMaxLength(300).IsRequired();
            e.Property(c => c.Model).HasMaxLength(100).IsRequired();
            e.Property(c => c.ApiKey).HasMaxLength(500);
            e.Property(c => c.SystemPrompt).HasMaxLength(4000).IsRequired();
            e.Property(c => c.Temperature).HasPrecision(4, 2);
            e.Property(c => c.UpdatedBy).HasMaxLength(50);

            e.HasData(new AiVoteSuggestionConfig
            {
                Id = 1,
                IsEnabled = false,
                BaseUrl = "https://api.openai.com/v1",
                Model = "gpt-4o-mini",
                ApiKey = null,
                SystemPrompt =
                    "你是一个校园纸飞机应用的投票助手。根据用户输入内容，生成一个投票标题和2-4个选项。" +
                    "输出必须是 JSON 对象，格式：{\"title\":\"...\",\"options\":[\"...\",\"...\"]}。" +
                    "要求：标题不超过60字，选项不超过20字，避免违法、辱骂、隐私暴露等不当内容。",
                Temperature = 0.7m,
                MaxTokens = 300,
                DefaultOptionCount = 3,
                TimeoutSeconds = 20,
                EnableFallback = true,
                PerUserMinuteLimit = 5,
                UpdateTime = new DateTime(2026, 4, 15, 0, 0, 0, DateTimeKind.Utc),
                UpdatedBy = "system"
            });
        });

        modelBuilder.Entity<AiVoteSuggestionLog>(e =>
        {
            e.ToTable("AiVoteSuggestionLogs", tb => tb.HasComment("AI投票建议日志表"));
            e.HasKey(l => l.Id);
            e.Property(l => l.ContentPreview).HasMaxLength(200).IsRequired();
            e.Property(l => l.Mood).HasMaxLength(20).IsRequired();
            e.Property(l => l.LocationTag).HasMaxLength(50).IsRequired();
            e.Property(l => l.GeneratedTitle).HasMaxLength(60);
            e.Property(l => l.Source).HasMaxLength(20).IsRequired();
            e.Property(l => l.Status).HasMaxLength(20).IsRequired();
            e.Property(l => l.ErrorMessage).HasMaxLength(500);
            e.Property(l => l.RawResponse).HasMaxLength(4000);
            e.Property(l => l.GeneratedOptionsJson).HasColumnType("nvarchar(max)");
            e.HasIndex(l => l.RequestId).IsUnique();
            e.HasIndex(l => l.CreateTime);
            e.HasIndex(l => l.AppUserId);
        });
    }
}


