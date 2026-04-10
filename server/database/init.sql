IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    CREATE TABLE [Locations] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(50) NOT NULL,
        [IsActive] bit NOT NULL,
        [SortOrder] int NOT NULL,
        [CreateTime] datetime2 NOT NULL,
        CONSTRAINT [PK_Locations] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    CREATE TABLE [Planes] (
        [Id] uniqueidentifier NOT NULL,
        [LocationTag] nvarchar(50) NOT NULL,
        [Content] nvarchar(200) NOT NULL,
        [Mood] nvarchar(20) NOT NULL,
        [CreateTime] datetime2 NOT NULL,
        [ExpireTime] datetime2 NOT NULL,
        [PickCount] int NOT NULL,
        [IsDeleted] bit NOT NULL,
        [ReportCount] int NOT NULL,
        [LikeCount] int NOT NULL,
        CONSTRAINT [PK_Planes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    CREATE TABLE [Comments] (
        [Id] uniqueidentifier NOT NULL,
        [PlaneId] uniqueidentifier NOT NULL,
        [Reply] nvarchar(200) NOT NULL,
        [NickName] nvarchar(30) NOT NULL,
        [CreateTime] datetime2 NOT NULL,
        CONSTRAINT [PK_Comments] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_Comments_Planes_PlaneId] FOREIGN KEY ([PlaneId]) REFERENCES [Planes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreateTime', N'IsActive', N'Name', N'SortOrder') AND [object_id] = OBJECT_ID(N'[Locations]'))
        SET IDENTITY_INSERT [Locations] ON;
    EXEC(N'INSERT INTO [Locations] ([Id], [CreateTime], [IsActive], [Name], [SortOrder])
    VALUES (1, ''2026-01-01T00:00:00.0000000Z'', CAST(1 AS bit), N''图书馆'', 1),
    (2, ''2026-01-01T00:00:00.0000000Z'', CAST(1 AS bit), N''食堂'', 2),
    (3, ''2026-01-01T00:00:00.0000000Z'', CAST(1 AS bit), N''操场'', 3),
    (4, ''2026-01-01T00:00:00.0000000Z'', CAST(1 AS bit), N''教学楼'', 4),
    (5, ''2026-01-01T00:00:00.0000000Z'', CAST(1 AS bit), N''宿舍楼'', 5),
    (6, ''2026-01-01T00:00:00.0000000Z'', CAST(1 AS bit), N''校门口'', 6)');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreateTime', N'IsActive', N'Name', N'SortOrder') AND [object_id] = OBJECT_ID(N'[Locations]'))
        SET IDENTITY_INSERT [Locations] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Comments_PlaneId] ON [Comments] ([PlaneId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Planes_ExpireTime] ON [Planes] ([ExpireTime]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    CREATE INDEX [IX_Planes_LocationTag] ON [Planes] ([LocationTag]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260310092037_InitialCreate'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260310092037_InitialCreate', N'9.0.14');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311173500_AddAdminAuth'
)
BEGIN
    CREATE TABLE [AdminUsers] (
        [Id] uniqueidentifier NOT NULL,
        [UserName] nvarchar(50) NOT NULL,
        [DisplayName] nvarchar(50) NOT NULL,
        [PasswordHash] nvarchar(200) NOT NULL,
        [PasswordSalt] nvarchar(200) NOT NULL,
        [Roles] nvarchar(200) NOT NULL,
        [IsActive] bit NOT NULL,
        [CreateTime] datetime2 NOT NULL,
        [LastLoginTime] datetime2 NULL,
        CONSTRAINT [PK_AdminUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311173500_AddAdminAuth'
)
BEGIN
    CREATE TABLE [AdminRefreshTokens] (
        [Id] uniqueidentifier NOT NULL,
        [AdminUserId] uniqueidentifier NOT NULL,
        [Token] nvarchar(200) NOT NULL,
        [ExpiresAt] datetime2 NOT NULL,
        [CreatedAt] datetime2 NOT NULL,
        [RevokedAt] datetime2 NULL,
        [ReplacedByToken] nvarchar(200) NULL,
        [CreatedByIp] nvarchar(45) NULL,
        CONSTRAINT [PK_AdminRefreshTokens] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AdminRefreshTokens_AdminUsers_AdminUserId] FOREIGN KEY ([AdminUserId]) REFERENCES [AdminUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311173500_AddAdminAuth'
)
BEGIN
    CREATE INDEX [IX_AdminRefreshTokens_AdminUserId] ON [AdminRefreshTokens] ([AdminUserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311173500_AddAdminAuth'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AdminRefreshTokens_Token] ON [AdminRefreshTokens] ([Token]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311173500_AddAdminAuth'
)
BEGIN
    CREATE UNIQUE INDEX [IX_AdminUsers_UserName] ON [AdminUsers] ([UserName]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260311173500_AddAdminAuth'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260311173500_AddAdminAuth', N'9.0.14');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330093034_AddTableComments'
)
BEGIN
    DECLARE @defaultSchema AS sysname;
    SET @defaultSchema = SCHEMA_NAME();
    DECLARE @description AS sql_variant;
    SET @description = N'纸飞机信息表，存储用户投递的纸飞机内容及状态';
    EXEC sp_addextendedproperty 'MS_Description', @description, 'SCHEMA', @defaultSchema, 'TABLE', N'Planes';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330093034_AddTableComments'
)
BEGIN
    DECLARE @defaultSchema1 AS sysname;
    SET @defaultSchema1 = SCHEMA_NAME();
    DECLARE @description1 AS sql_variant;
    SET @description1 = N'地点配置表，存储系统内可选的投递地点';
    EXEC sp_addextendedproperty 'MS_Description', @description1, 'SCHEMA', @defaultSchema1, 'TABLE', N'Locations';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330093034_AddTableComments'
)
BEGIN
    DECLARE @defaultSchema2 AS sysname;
    SET @defaultSchema2 = SCHEMA_NAME();
    DECLARE @description2 AS sql_variant;
    SET @description2 = N'纸飞机评论表，存储纸飞机的回复内容';
    EXEC sp_addextendedproperty 'MS_Description', @description2, 'SCHEMA', @defaultSchema2, 'TABLE', N'Comments';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330093034_AddTableComments'
)
BEGIN
    DECLARE @defaultSchema3 AS sysname;
    SET @defaultSchema3 = SCHEMA_NAME();
    DECLARE @description3 AS sql_variant;
    SET @description3 = N'后台管理员表，存储后台登录账号与权限信息';
    EXEC sp_addextendedproperty 'MS_Description', @description3, 'SCHEMA', @defaultSchema3, 'TABLE', N'AdminUsers';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330093034_AddTableComments'
)
BEGIN
    DECLARE @defaultSchema4 AS sysname;
    SET @defaultSchema4 = SCHEMA_NAME();
    DECLARE @description4 AS sql_variant;
    SET @description4 = N'后台刷新令牌表，存储管理员登录后的刷新令牌记录';
    EXEC sp_addextendedproperty 'MS_Description', @description4, 'SCHEMA', @defaultSchema4, 'TABLE', N'AdminRefreshTokens';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330093034_AddTableComments'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330093034_AddTableComments', N'9.0.14');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330095000_AddEfMigrationsHistoryComment'
)
BEGIN
    DECLARE @defaultSchema5 AS sysname;
    SET @defaultSchema5 = SCHEMA_NAME();
    DECLARE @description5 AS sql_variant;
    SET @description5 = N'EF Core 迁移历史表，记录数据库已执行的迁移版本';
    EXEC sp_addextendedproperty 'MS_Description', @description5, 'SCHEMA', @defaultSchema5, 'TABLE', N'__EFMigrationsHistory';
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330095000_AddEfMigrationsHistoryComment'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330095000_AddEfMigrationsHistoryComment', N'9.0.14');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330113000_AddPlaneAttitudeVotes'
)
BEGIN
    CREATE TABLE [PlaneAttitudeVotes] (
        [Id] uniqueidentifier NOT NULL,
        [PlaneId] uniqueidentifier NOT NULL,
        [VoterKey] nvarchar(100) NOT NULL,
        [OptionKey] nvarchar(30) NOT NULL,
        [CreateTime] datetime2 NOT NULL,
        [UpdateTime] datetime2 NOT NULL,
        CONSTRAINT [PK_PlaneAttitudeVotes] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_PlaneAttitudeVotes_Planes_PlaneId] FOREIGN KEY ([PlaneId]) REFERENCES [Planes] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330113000_AddPlaneAttitudeVotes'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [IX_PlaneAttitudeVotes_PlaneId_VoterKey] ON [PlaneAttitudeVotes] ([PlaneId], [VoterKey]) WHERE [PlaneId] IS NOT NULL AND [VoterKey] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330113000_AddPlaneAttitudeVotes'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330113000_AddPlaneAttitudeVotes', N'9.0.14');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330121500_AddCommentReplies'
)
BEGIN
    ALTER TABLE [Comments] ADD [ParentCommentId] uniqueidentifier NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330121500_AddCommentReplies'
)
BEGIN
    CREATE INDEX [IX_Comments_ParentCommentId] ON [Comments] ([ParentCommentId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330121500_AddCommentReplies'
)
BEGIN
    ALTER TABLE [Comments] ADD CONSTRAINT [FK_Comments_Comments_ParentCommentId] FOREIGN KEY ([ParentCommentId]) REFERENCES [Comments] ([Id]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260330121500_AddCommentReplies'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260330121500_AddCommentReplies', N'9.0.14');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331100000_AddPlaneVoteConfig'
)
BEGIN
    ALTER TABLE [Planes] ADD [VoteOptionsJson] nvarchar(max) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331100000_AddPlaneVoteConfig'
)
BEGIN
    ALTER TABLE [Planes] ADD [VoteTitle] nvarchar(60) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331100000_AddPlaneVoteConfig'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260331100000_AddPlaneVoteConfig', N'9.0.14');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331104000_AddPlaneAuthorFields'
)
BEGIN
    ALTER TABLE [Planes] ADD [AuthorName] nvarchar(30) NULL;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331104000_AddPlaneAuthorFields'
)
BEGIN
    ALTER TABLE [Planes] ADD [IsAnonymous] bit NOT NULL DEFAULT CAST(1 AS bit);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20260331104000_AddPlaneAuthorFields'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20260331104000_AddPlaneAuthorFields', N'9.0.14');
END;

COMMIT;
GO

