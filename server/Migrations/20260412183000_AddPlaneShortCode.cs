using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using server.Data;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260412183000_AddPlaneShortCode")]
    public partial class AddPlaneShortCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF COL_LENGTH(N'[Planes]', N'ShortCode') IS NULL
                BEGIN
                    ALTER TABLE [Planes] ADD [ShortCode] nvarchar(10) NULL;
                END
                """);

            migrationBuilder.Sql(
                """
                DECLARE @alphabet nvarchar(32) = N'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                DECLARE @id uniqueidentifier;
                DECLARE @code nvarchar(10);

                DECLARE code_cursor CURSOR LOCAL FAST_FORWARD FOR
                    SELECT [Id]
                    FROM [Planes]
                    WHERE [ShortCode] IS NULL OR [ShortCode] = N'';

                OPEN code_cursor;
                FETCH NEXT FROM code_cursor INTO @id;

                WHILE @@FETCH_STATUS = 0
                BEGIN
                    WHILE 1 = 1
                    BEGIN
                        DECLARE @bytes varbinary(10) = CRYPT_GEN_RANDOM(10);
                        DECLARE @i int = 1;
                        SET @code = N'';

                        WHILE @i <= 10
                        BEGIN
                            DECLARE @b int = CONVERT(int, SUBSTRING(@bytes, @i, 1));
                            SET @code = @code + SUBSTRING(@alphabet, (@b % 32) + 1, 1);
                            SET @i = @i + 1;
                        END

                        IF NOT EXISTS (
                            SELECT 1
                            FROM [Planes]
                            WHERE [ShortCode] = @code
                        )
                        BEGIN
                            BREAK;
                        END
                    END

                    UPDATE [Planes]
                    SET [ShortCode] = @code
                    WHERE [Id] = @id;

                    FETCH NEXT FROM code_cursor INTO @id;
                END

                CLOSE code_cursor;
                DEALLOCATE code_cursor;
                """);

            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM [Planes]
                    WHERE [ShortCode] IS NULL OR [ShortCode] = N''
                )
                BEGIN
                    THROW 51000, N'Backfill plane short code failed.', 1;
                END
                """);

            migrationBuilder.AlterColumn<string>(
                name: "ShortCode",
                table: "Planes",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10,
                oldNullable: true);

            migrationBuilder.Sql(
                """
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_Planes_ShortCode'
                      AND [object_id] = OBJECT_ID(N'[Planes]')
                )
                BEGIN
                    CREATE UNIQUE INDEX [IX_Planes_ShortCode] ON [Planes]([ShortCode]);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE [name] = N'IX_Planes_ShortCode'
                      AND [object_id] = OBJECT_ID(N'[Planes]')
                )
                BEGIN
                    DROP INDEX [IX_Planes_ShortCode] ON [Planes];
                END
                """);

            migrationBuilder.Sql(
                """
                IF COL_LENGTH(N'[Planes]', N'ShortCode') IS NOT NULL
                BEGIN
                    ALTER TABLE [Planes] DROP COLUMN [ShortCode];
                END
                """);
        }
    }
}
