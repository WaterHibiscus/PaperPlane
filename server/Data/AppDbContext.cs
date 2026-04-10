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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Plane>(e =>
        {
            e.ToTable("Planes", tb => tb.HasComment("纸飞机信息表"));
            e.HasKey(p => p.Id);
            e.Property(p => p.Content).HasMaxLength(200).IsRequired();
            e.Property(p => p.LocationTag).HasMaxLength(50).IsRequired();
            e.Property(p => p.Mood).HasMaxLength(20);
            e.Property(p => p.AuthorName).HasMaxLength(30);
            e.Property(p => p.ImageUrlsJson).HasColumnType("nvarchar(max)");
            e.Property(p => p.VoteTitle).HasMaxLength(60);
            e.Property(p => p.VoteOptionsJson).HasColumnType("nvarchar(max)");
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
    }
}


