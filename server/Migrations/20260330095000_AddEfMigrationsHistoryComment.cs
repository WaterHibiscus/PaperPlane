using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260330095000_AddEfMigrationsHistoryComment")]
    public partial class AddEfMigrationsHistoryComment : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterTable(
                name: "__EFMigrationsHistory",
                comment: "EF Core 迁移历史表，记录数据库已执行的迁移版本");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterTable(
                name: "__EFMigrationsHistory",
                oldComment: "EF Core 迁移历史表，记录数据库已执行的迁移版本");
        }
    }
}
