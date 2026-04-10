using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddAppUserAndPlaneHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'dbo.AppUsers', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.AppUsers', N'Username') IS NULL
                BEGIN
                    DECLARE @legacyTable sysname = N'LegacyAppUsers_20260408';
                    DECLARE @i int = 1;
                    WHILE OBJECT_ID(N'dbo.' + @legacyTable, N'U') IS NOT NULL
                    BEGIN
                        SET @legacyTable = N'LegacyAppUsers_20260408_' + CAST(@i AS nvarchar(10));
                        SET @i = @i + 1;
                    END;

                    EXEC(N'EXEC sp_rename N''dbo.AppUsers'', N''' + @legacyTable + N''', N''OBJECT'';');
                END;

                IF OBJECT_ID(N'dbo.PK_AppUsers', N'PK') IS NOT NULL
                BEGIN
                    DECLARE @legacyPk sysname = N'PK_LegacyAppUsers_20260408';
                    DECLARE @j int = 1;
                    WHILE OBJECT_ID(N'dbo.' + @legacyPk, N'PK') IS NOT NULL
                    BEGIN
                        SET @legacyPk = N'PK_LegacyAppUsers_20260408_' + CAST(@j AS nvarchar(10));
                        SET @j = @j + 1;
                    END;

                    EXEC(N'EXEC sp_rename N''dbo.PK_AppUsers'', N''' + @legacyPk + N''', N''OBJECT'';');
                END;
                """);

            migrationBuilder.AlterTable(
                name: "Planes",
                comment: "纸飞机信息表",
                oldComment: "纸飞机信息表，存储用户投递的纸飞机内容及状态");

            migrationBuilder.AlterTable(
                name: "PlaneAttitudeVotes",
                comment: "纸飞机态度投票表",
                oldComment: "纸飞机态度投票表，存储每个设备对纸飞机的当前态度选择");

            migrationBuilder.AlterTable(
                name: "Locations",
                comment: "地点配置表",
                oldComment: "地点配置表，存储系统内可选的投递地点");

            migrationBuilder.AlterTable(
                name: "Comments",
                comment: "纸飞机评论表",
                oldComment: "纸飞机评论表，存储纸飞机的回复内容");

            migrationBuilder.AlterTable(
                name: "AdminUsers",
                comment: "后台管理员表",
                oldComment: "后台管理员表，存储后台登录账号与权限信息");

            migrationBuilder.AlterTable(
                name: "AdminRefreshTokens",
                comment: "后台刷新令牌表",
                oldComment: "后台刷新令牌表，存储管理员登录后的刷新令牌记录");

            migrationBuilder.AddColumn<Guid>(
                name: "CreatorUserId",
                table: "Planes",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RecalledAt",
                table: "Planes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "AppUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(12)", maxLength: 12, nullable: false),
                    StudentId = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Phone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    PasswordSalt = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    AvatarUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Gender = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    Bio = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastLoginTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AppUsers", x => x.Id);
                },
                comment: "用户端账号表");

            migrationBuilder.CreateTable(
                name: "PlaneLikeRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlaneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    FueledAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaneLikeRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlaneLikeRecords_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlaneLikeRecords_Planes_PlaneId",
                        column: x => x.PlaneId,
                        principalTable: "Planes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                },
                comment: "续航记录表");

            migrationBuilder.CreateTable(
                name: "PlanePickRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlaneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PickedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanePickRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlanePickRecords_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanePickRecords_Planes_PlaneId",
                        column: x => x.PlaneId,
                        principalTable: "Planes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                },
                comment: "拾取记录表");

            migrationBuilder.CreateTable(
                name: "UserRefreshTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Token = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ReplacedByToken = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    CreatedByIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRefreshTokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserRefreshTokens_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                },
                comment: "用户刷新令牌表");

            migrationBuilder.CreateIndex(
                name: "IX_Planes_CreatorUserId",
                table: "Planes",
                column: "CreatorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_Phone",
                table: "AppUsers",
                column: "Phone",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AppUsers_StudentId",
                table: "AppUsers",
                column: "StudentId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlaneLikeRecords_AppUserId",
                table: "PlaneLikeRecords",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaneLikeRecords_PlaneId_AppUserId",
                table: "PlaneLikeRecords",
                columns: new[] { "PlaneId", "AppUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PlanePickRecords_AppUserId",
                table: "PlanePickRecords",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanePickRecords_PlaneId_AppUserId",
                table: "PlanePickRecords",
                columns: new[] { "PlaneId", "AppUserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRefreshTokens_AppUserId",
                table: "UserRefreshTokens",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_UserRefreshTokens_Token",
                table: "UserRefreshTokens",
                column: "Token",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Planes_AppUsers_CreatorUserId",
                table: "Planes",
                column: "CreatorUserId",
                principalTable: "AppUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Planes_AppUsers_CreatorUserId",
                table: "Planes");

            migrationBuilder.DropTable(
                name: "PlaneLikeRecords");

            migrationBuilder.DropTable(
                name: "PlanePickRecords");

            migrationBuilder.DropTable(
                name: "UserRefreshTokens");

            migrationBuilder.DropTable(
                name: "AppUsers");

            migrationBuilder.DropIndex(
                name: "IX_Planes_CreatorUserId",
                table: "Planes");

            migrationBuilder.DropColumn(
                name: "CreatorUserId",
                table: "Planes");

            migrationBuilder.DropColumn(
                name: "RecalledAt",
                table: "Planes");

            migrationBuilder.AlterTable(
                name: "Planes",
                comment: "纸飞机信息表，存储用户投递的纸飞机内容及状态",
                oldComment: "纸飞机信息表");

            migrationBuilder.AlterTable(
                name: "PlaneAttitudeVotes",
                comment: "纸飞机态度投票表，存储每个设备对纸飞机的当前态度选择",
                oldComment: "纸飞机态度投票表");

            migrationBuilder.AlterTable(
                name: "Locations",
                comment: "地点配置表，存储系统内可选的投递地点",
                oldComment: "地点配置表");

            migrationBuilder.AlterTable(
                name: "Comments",
                comment: "纸飞机评论表，存储纸飞机的回复内容",
                oldComment: "纸飞机评论表");

            migrationBuilder.AlterTable(
                name: "AdminUsers",
                comment: "后台管理员表，存储后台登录账号与权限信息",
                oldComment: "后台管理员表");

            migrationBuilder.AlterTable(
                name: "AdminRefreshTokens",
                comment: "后台刷新令牌表，存储管理员登录后的刷新令牌记录",
                oldComment: "后台刷新令牌表");
        }
    }
}
