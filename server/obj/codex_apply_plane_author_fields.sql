IF COL_LENGTH(N'dbo.Planes', N'AuthorName') IS NULL
BEGIN
    ALTER TABLE [dbo].[Planes] ADD [AuthorName] nvarchar(30) NULL;
END;

IF COL_LENGTH(N'dbo.Planes', N'IsAnonymous') IS NULL
BEGIN
    ALTER TABLE [dbo].[Planes] ADD [IsAnonymous] bit NOT NULL CONSTRAINT [DF_Planes_IsAnonymous] DEFAULT(1);
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = N'20260331104000_AddPlaneAuthorFields')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260331104000_AddPlaneAuthorFields', N'9.0.13');
END;
