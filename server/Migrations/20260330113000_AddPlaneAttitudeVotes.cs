using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260330113000_AddPlaneAttitudeVotes")]
    public partial class AddPlaneAttitudeVotes : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PlaneAttitudeVotes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PlaneId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    VoterKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    OptionKey = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdateTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlaneAttitudeVotes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PlaneAttitudeVotes_Planes_PlaneId",
                        column: x => x.PlaneId,
                        principalTable: "Planes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlaneAttitudeVotes_PlaneId_VoterKey",
                table: "PlaneAttitudeVotes",
                columns: new[] { "PlaneId", "VoterKey" },
                unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlaneAttitudeVotes");
        }
    }
}
