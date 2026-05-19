using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260415190000_AddPlaneReportRecords")]
    public partial class AddPlaneReportRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlaneReportRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlaneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReportReason = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    ReportDetail = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    ReportedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaneReportRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlaneReportRecords_AppUsers_AppUserId",
                        column: x => x.AppUserId,
                        principalTable: "AppUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PlaneReportRecords_Planes_PlaneId",
                        column: x => x.PlaneId,
                        principalTable: "Planes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("SqlServer:Comment", "举报记录表");

            migrationBuilder.CreateIndex(
                name: "IX_PlaneReportRecords_AppUserId",
                table: "PlaneReportRecords",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaneReportRecords_PlaneId",
                table: "PlaneReportRecords",
                column: "PlaneId");

            migrationBuilder.CreateIndex(
                name: "IX_PlaneReportRecords_PlaneId_AppUserId",
                table: "PlaneReportRecords",
                columns: new[] { "PlaneId", "AppUserId" },
                unique: true,
                filter: "[AppUserId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlaneReportRecords");
        }
    }
}
