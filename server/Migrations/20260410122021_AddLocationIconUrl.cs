using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationIconUrl : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH(N'[Locations]', N'IconUrl') IS NULL
                BEGIN
                    ALTER TABLE [Locations] ADD [IconUrl] nvarchar(500) NULL;
                END
                """);

            migrationBuilder.AlterTable(
                name: "Planes",
                comment: "纸飞机信息表",
                oldComment: "绾搁鏈轰俊鎭〃");

            migrationBuilder.AlterTable(
                name: "Comments",
                comment: "纸飞机评论表",
                oldComment: "绾搁鏈鸿瘎璁鸿〃");

            migrationBuilder.AlterTable(
                name: "AppUsers",
                comment: "用户端账号表",
                oldComment: "鐢ㄦ埛绔处鍙疯〃");

            migrationBuilder.AlterTable(
                name: "AdminUsers",
                comment: "后台管理员表",
                oldComment: "鍚庡彴绠＄悊鍛樿〃");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH(N'[Locations]', N'IconUrl') IS NOT NULL
                BEGIN
                    ALTER TABLE [Locations] DROP COLUMN [IconUrl];
                END
                """);

            migrationBuilder.AlterTable(
                name: "Planes",
                comment: "绾搁鏈轰俊鎭〃",
                oldComment: "纸飞机信息表");

            migrationBuilder.AlterTable(
                name: "Comments",
                comment: "绾搁鏈鸿瘎璁鸿〃",
                oldComment: "纸飞机评论表");

            migrationBuilder.AlterTable(
                name: "AppUsers",
                comment: "鐢ㄦ埛绔处鍙疯〃",
                oldComment: "用户端账号表");

            migrationBuilder.AlterTable(
                name: "AdminUsers",
                comment: "鍚庡彴绠＄悊鍛樿〃",
                oldComment: "后台管理员表");
        }
    }
}
