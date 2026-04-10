using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddTableComments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterTable(
                name: "Planes",
                comment: "纸飞机信息表，存储用户投递的纸飞机内容及状态");

            migrationBuilder.AlterTable(
                name: "Locations",
                comment: "地点配置表，存储系统内可选的投递地点");

            migrationBuilder.AlterTable(
                name: "Comments",
                comment: "纸飞机评论表，存储纸飞机的回复内容");

            migrationBuilder.AlterTable(
                name: "AdminUsers",
                comment: "后台管理员表，存储后台登录账号与权限信息");

            migrationBuilder.AlterTable(
                name: "AdminRefreshTokens",
                comment: "后台刷新令牌表，存储管理员登录后的刷新令牌记录");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterTable(
                name: "Planes",
                oldComment: "纸飞机信息表，存储用户投递的纸飞机内容及状态");

            migrationBuilder.AlterTable(
                name: "Locations",
                oldComment: "地点配置表，存储系统内可选的投递地点");

            migrationBuilder.AlterTable(
                name: "Comments",
                oldComment: "纸飞机评论表，存储纸飞机的回复内容");

            migrationBuilder.AlterTable(
                name: "AdminUsers",
                oldComment: "后台管理员表，存储后台登录账号与权限信息");

            migrationBuilder.AlterTable(
                name: "AdminRefreshTokens",
                oldComment: "后台刷新令牌表，存储管理员登录后的刷新令牌记录");
        }
    }
}
