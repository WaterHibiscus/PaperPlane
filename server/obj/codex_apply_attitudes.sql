IF OBJECT_ID(N'dbo.PlaneAttitudeVotes', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[PlaneAttitudeVotes] (
        [Id] uniqueidentifier NOT NULL,
        [PlaneId] uniqueidentifier NOT NULL,
        [VoterKey] nvarchar(100) NOT NULL,
        [OptionKey] nvarchar(30) NOT NULL,
        [CreateTime] datetime2 NOT NULL,
        [UpdateTime] datetime2 NOT NULL,
        CONSTRAINT [PK_PlaneAttitudeVotes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PlaneAttitudeVotes_Planes_PlaneId] FOREIGN KEY ([PlaneId]) REFERENCES [dbo].[Planes]([Id]) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX [IX_PlaneAttitudeVotes_PlaneId_VoterKey] ON [dbo].[PlaneAttitudeVotes]([PlaneId], [VoterKey]);
END;

IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = N'20260330113000_AddPlaneAttitudeVotes')
BEGIN
    INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330113000_AddPlaneAttitudeVotes', N'9.0.13');
END;
