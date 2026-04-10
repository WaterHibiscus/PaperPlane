IF COL_LENGTH(N'dbo.Comments', N'ParentCommentId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Comments] ADD [ParentCommentId] uniqueidentifier NULL;
END;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Comments_ParentCommentId' AND object_id = OBJECT_ID(N'dbo.Comments'))
BEGIN
    CREATE INDEX [IX_Comments_ParentCommentId] ON [dbo].[Comments]([ParentCommentId]);
END;

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Comments_Comments_ParentCommentId')
BEGIN
    ALTER TABLE [dbo].[Comments] ADD CONSTRAINT [FK_Comments_Comments_ParentCommentId]
        FOREIGN KEY ([ParentCommentId]) REFERENCES [dbo].[Comments]([Id]);
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = N'20260330121500_AddCommentReplies')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330121500_AddCommentReplies', N'9.0.13');
END;
