IF COL_LENGTH(N'dbo.Planes', N'ImageUrlsJson') IS NULL
BEGIN
    ALTER TABLE [dbo].[Planes] ADD [ImageUrlsJson] nvarchar(max) NULL;
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = N'20260331113000_AddPlaneImages')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260331113000_AddPlaneImages', N'9.0.13');
END;
