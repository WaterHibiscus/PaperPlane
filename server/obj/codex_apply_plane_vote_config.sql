IF COL_LENGTH(N'dbo.Planes', N'VoteTitle') IS NULL
BEGIN
    ALTER TABLE [dbo].[Planes] ADD [VoteTitle] nvarchar(60) NULL;
END;

IF COL_LENGTH(N'dbo.Planes', N'VoteOptionsJson') IS NULL
BEGIN
    ALTER TABLE [dbo].[Planes] ADD [VoteOptionsJson] nvarchar(max) NULL;
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = N'20260331100000_AddPlaneVoteConfig')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260331100000_AddPlaneVoteConfig', N'9.0.13');
END;
