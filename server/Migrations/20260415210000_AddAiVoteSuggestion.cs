using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddAiVoteSuggestion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AiVoteSuggestionConfigs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    BaseUrl = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                    Model = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    ApiKey = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    SystemPrompt = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Temperature = table.Column<decimal>(type: "decimal(4,2)", precision: 4, scale: 2, nullable: false),
                    MaxTokens = table.Column<int>(type: "int", nullable: false),
                    DefaultOptionCount = table.Column<int>(type: "int", nullable: false),
                    TimeoutSeconds = table.Column<int>(type: "int", nullable: false),
                    EnableFallback = table.Column<bool>(type: "bit", nullable: false),
                    PerUserMinuteLimit = table.Column<int>(type: "int", nullable: false),
                    UpdateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedBy = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiVoteSuggestionConfigs", x => x.Id);
                },
                comment: "AI投票建议配置表");

            migrationBuilder.CreateTable(
                name: "AiVoteSuggestionLogs",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RequestId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    AppUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ContentPreview = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Mood = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    LocationTag = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    RequestedOptionCount = table.Column<int>(type: "int", nullable: false),
                    GeneratedTitle = table.Column<string>(type: "nvarchar(60)", maxLength: 60, nullable: true),
                    GeneratedOptionsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Source = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    ErrorMessage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    RawResponse = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: true),
                    DurationMs = table.Column<int>(type: "int", nullable: false),
                    CreateTime = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AiVoteSuggestionLogs", x => x.Id);
                },
                comment: "AI投票建议日志表");

            migrationBuilder.InsertData(
                table: "AiVoteSuggestionConfigs",
                columns: new[] { "Id", "ApiKey", "BaseUrl", "DefaultOptionCount", "EnableFallback", "IsEnabled", "MaxTokens", "Model", "PerUserMinuteLimit", "SystemPrompt", "Temperature", "TimeoutSeconds", "UpdateTime", "UpdatedBy" },
                values: new object[] { 1, null, "https://api.openai.com/v1", 3, true, false, 300, "gpt-4o-mini", 5, "你是一个校园纸飞机应用的投票助手。根据用户输入内容，生成一个投票标题和2-4个选项。输出必须是 JSON 对象，格式：{\"title\":\"...\",\"options\":[\"...\",\"...\"]}。要求：标题不超过60字，选项不超过20字，避免违法、辱骂、隐私暴露等不当内容。", 0.7m, 20, new DateTime(2026, 4, 15, 0, 0, 0, 0, DateTimeKind.Utc), "system" });

            migrationBuilder.CreateIndex(
                name: "IX_AiVoteSuggestionLogs_AppUserId",
                table: "AiVoteSuggestionLogs",
                column: "AppUserId");

            migrationBuilder.CreateIndex(
                name: "IX_AiVoteSuggestionLogs_CreateTime",
                table: "AiVoteSuggestionLogs",
                column: "CreateTime");

            migrationBuilder.CreateIndex(
                name: "IX_AiVoteSuggestionLogs_RequestId",
                table: "AiVoteSuggestionLogs",
                column: "RequestId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AiVoteSuggestionConfigs");

            migrationBuilder.DropTable(
                name: "AiVoteSuggestionLogs");
        }
    }
}
