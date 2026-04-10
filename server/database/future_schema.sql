USE [PaperPlane];
GO

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.__SetTableComment', N'P') IS NOT NULL
    DROP PROCEDURE dbo.__SetTableComment;
GO

CREATE PROCEDURE dbo.__SetTableComment
    @TableName sysname,
    @Description nvarchar(4000)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.tables t
        INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE s.name = N'dbo'
          AND t.name = @TableName
    )
        RETURN;

    IF EXISTS (
        SELECT 1
        FROM sys.extended_properties ep
        INNER JOIN sys.tables t ON t.object_id = ep.major_id AND ep.minor_id = 0
        INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE ep.name = N'MS_Description'
          AND s.name = N'dbo'
          AND t.name = @TableName
    )
    BEGIN
        EXEC sys.sp_updateextendedproperty
            @name = N'MS_Description',
            @value = @Description,
            @level0type = N'SCHEMA', @level0name = N'dbo',
            @level1type = N'TABLE', @level1name = @TableName;
    END
    ELSE
    BEGIN
        EXEC sys.sp_addextendedproperty
            @name = N'MS_Description',
            @value = @Description,
            @level0type = N'SCHEMA', @level0name = N'dbo',
            @level1type = N'TABLE', @level1name = @TableName;
    END
END;
GO

IF OBJECT_ID(N'dbo.__SetColumnComment', N'P') IS NOT NULL
    DROP PROCEDURE dbo.__SetColumnComment;
GO

CREATE PROCEDURE dbo.__SetColumnComment
    @TableName sysname,
    @ColumnName sysname,
    @Description nvarchar(4000)
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON t.object_id = c.object_id
        INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
        WHERE s.name = N'dbo'
          AND t.name = @TableName
          AND c.name = @ColumnName
    )
        RETURN;

    IF EXISTS (
        SELECT 1
        FROM sys.extended_properties ep
        INNER JOIN sys.tables t ON t.object_id = ep.major_id
        INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
        INNER JOIN sys.columns c ON c.object_id = t.object_id AND c.column_id = ep.minor_id
        WHERE ep.name = N'MS_Description'
          AND s.name = N'dbo'
          AND t.name = @TableName
          AND c.name = @ColumnName
    )
    BEGIN
        EXEC sys.sp_updateextendedproperty
            @name = N'MS_Description',
            @value = @Description,
            @level0type = N'SCHEMA', @level0name = N'dbo',
            @level1type = N'TABLE', @level1name = @TableName,
            @level2type = N'COLUMN', @level2name = @ColumnName;
    END
    ELSE
    BEGIN
        EXEC sys.sp_addextendedproperty
            @name = N'MS_Description',
            @value = @Description,
            @level0type = N'SCHEMA', @level0name = N'dbo',
            @level1type = N'TABLE', @level1name = @TableName,
            @level2type = N'COLUMN', @level2name = @ColumnName;
    END
END;
GO

IF OBJECT_ID(N'dbo.AppUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AppUsers
    (
        Id uniqueidentifier NOT NULL,
        UserNo nvarchar(50) NOT NULL,
        RegisterChannel nvarchar(20) NOT NULL CONSTRAINT DF_AppUsers_RegisterChannel DEFAULT (N'UNIAPP'),
        Status nvarchar(20) NOT NULL CONSTRAINT DF_AppUsers_Status DEFAULT (N'ACTIVE'),
        LastActiveTime datetime2 NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_AppUsers_CreateTime DEFAULT (SYSUTCDATETIME()),
        UpdateTime datetime2 NOT NULL CONSTRAINT DF_AppUsers_UpdateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_AppUsers PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_AppUsers_UserNo UNIQUE NONCLUSTERED (UserNo)
    );
END;
GO

IF OBJECT_ID(N'dbo.UserDevices', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserDevices
    (
        Id uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NOT NULL,
        DeviceKey nvarchar(100) NOT NULL,
        DeviceName nvarchar(50) NULL,
        Platform nvarchar(30) NOT NULL CONSTRAINT DF_UserDevices_Platform DEFAULT (N'unknown'),
        AppVersion nvarchar(30) NULL,
        LastKnownIp nvarchar(45) NULL,
        LastKnownLocation nvarchar(50) NULL,
        IsPrimary bit NOT NULL CONSTRAINT DF_UserDevices_IsPrimary DEFAULT ((0)),
        IsActive bit NOT NULL CONSTRAINT DF_UserDevices_IsActive DEFAULT ((1)),
        FirstSeenTime datetime2 NOT NULL CONSTRAINT DF_UserDevices_FirstSeenTime DEFAULT (SYSUTCDATETIME()),
        LastSeenTime datetime2 NOT NULL CONSTRAINT DF_UserDevices_LastSeenTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_UserDevices PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_UserDevices_DeviceKey UNIQUE NONCLUSTERED (DeviceKey),
        CONSTRAINT FK_UserDevices_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.UserDevices')
      AND name = N'IX_UserDevices_AppUserId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserDevices_AppUserId ON dbo.UserDevices (AppUserId);
END;
GO

IF OBJECT_ID(N'dbo.UserPreferences', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserPreferences
    (
        Id uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NOT NULL,
        ProfileName nvarchar(30) NULL,
        Theme nvarchar(20) NOT NULL CONSTRAINT DF_UserPreferences_Theme DEFAULT (N'light'),
        CurrentLocation nvarchar(50) NULL,
        [Language] nvarchar(20) NOT NULL CONSTRAINT DF_UserPreferences_Language DEFAULT (N'zh-CN'),
        NotificationEnabled bit NOT NULL CONSTRAINT DF_UserPreferences_NotificationEnabled DEFAULT ((1)),
        UpdateTime datetime2 NOT NULL CONSTRAINT DF_UserPreferences_UpdateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_UserPreferences PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_UserPreferences_AppUserId UNIQUE NONCLUSTERED (AppUserId),
        CONSTRAINT FK_UserPreferences_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id) ON DELETE CASCADE
    );
END;
GO

IF OBJECT_ID(N'dbo.UserPlaneLinks', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserPlaneLinks
    (
        Id uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NOT NULL,
        PlaneId uniqueidentifier NOT NULL,
        SourceDeviceId uniqueidentifier NULL,
        LinkType nvarchar(20) NOT NULL,
        Remark nvarchar(100) NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_UserPlaneLinks_CreateTime DEFAULT (SYSUTCDATETIME()),
        UpdateTime datetime2 NOT NULL CONSTRAINT DF_UserPlaneLinks_UpdateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_UserPlaneLinks PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_UserPlaneLinks_AppUserId_PlaneId_LinkType UNIQUE NONCLUSTERED (AppUserId, PlaneId, LinkType),
        CONSTRAINT FK_UserPlaneLinks_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserPlaneLinks_Planes_PlaneId FOREIGN KEY (PlaneId) REFERENCES dbo.Planes (Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserPlaneLinks_UserDevices_SourceDeviceId FOREIGN KEY (SourceDeviceId) REFERENCES dbo.UserDevices (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.UserPlaneLinks')
      AND name = N'IX_UserPlaneLinks_PlaneId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserPlaneLinks_PlaneId ON dbo.UserPlaneLinks (PlaneId);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.UserPlaneLinks')
      AND name = N'IX_UserPlaneLinks_AppUserId_LinkType'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserPlaneLinks_AppUserId_LinkType ON dbo.UserPlaneLinks (AppUserId, LinkType);
END;
GO

IF OBJECT_ID(N'dbo.UserDrafts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserDrafts
    (
        Id uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NOT NULL,
        DeviceId uniqueidentifier NULL,
        DraftType nvarchar(20) NOT NULL,
        DraftKey nvarchar(50) NOT NULL,
        PayloadJson nvarchar(max) NOT NULL,
        IsAutoSaved bit NOT NULL CONSTRAINT DF_UserDrafts_IsAutoSaved DEFAULT ((1)),
        ExpireTime datetime2 NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_UserDrafts_CreateTime DEFAULT (SYSUTCDATETIME()),
        UpdateTime datetime2 NOT NULL CONSTRAINT DF_UserDrafts_UpdateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_UserDrafts PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_UserDrafts_AppUserId_DraftKey UNIQUE NONCLUSTERED (AppUserId, DraftKey),
        CONSTRAINT FK_UserDrafts_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id) ON DELETE CASCADE,
        CONSTRAINT FK_UserDrafts_UserDevices_DeviceId FOREIGN KEY (DeviceId) REFERENCES dbo.UserDevices (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.UserDrafts')
      AND name = N'IX_UserDrafts_DeviceId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_UserDrafts_DeviceId ON dbo.UserDrafts (DeviceId);
END;
GO

IF OBJECT_ID(N'dbo.PlaneMediaAssets', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlaneMediaAssets
    (
        Id uniqueidentifier NOT NULL,
        PlaneId uniqueidentifier NOT NULL,
        AssetUrl nvarchar(500) NOT NULL,
        AssetType nvarchar(20) NOT NULL CONSTRAINT DF_PlaneMediaAssets_AssetType DEFAULT (N'IMAGE'),
        SortOrder int NOT NULL CONSTRAINT DF_PlaneMediaAssets_SortOrder DEFAULT ((0)),
        Source nvarchar(20) NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_PlaneMediaAssets_CreateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_PlaneMediaAssets PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_PlaneMediaAssets_PlaneId_AssetUrl UNIQUE NONCLUSTERED (PlaneId, AssetUrl),
        CONSTRAINT FK_PlaneMediaAssets_Planes_PlaneId FOREIGN KEY (PlaneId) REFERENCES dbo.Planes (Id) ON DELETE CASCADE
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PlaneMediaAssets')
      AND name = N'IX_PlaneMediaAssets_PlaneId_SortOrder'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlaneMediaAssets_PlaneId_SortOrder ON dbo.PlaneMediaAssets (PlaneId, SortOrder);
END;
GO

IF OBJECT_ID(N'dbo.PlaneLikeLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlaneLikeLogs
    (
        Id uniqueidentifier NOT NULL,
        PlaneId uniqueidentifier NOT NULL,
        UserDeviceId uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NULL,
        IsCanceled bit NOT NULL CONSTRAINT DF_PlaneLikeLogs_IsCanceled DEFAULT ((0)),
        CancelTime datetime2 NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_PlaneLikeLogs_CreateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_PlaneLikeLogs PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_PlaneLikeLogs_PlaneId_UserDeviceId UNIQUE NONCLUSTERED (PlaneId, UserDeviceId),
        CONSTRAINT FK_PlaneLikeLogs_Planes_PlaneId FOREIGN KEY (PlaneId) REFERENCES dbo.Planes (Id) ON DELETE CASCADE,
        CONSTRAINT FK_PlaneLikeLogs_UserDevices_UserDeviceId FOREIGN KEY (UserDeviceId) REFERENCES dbo.UserDevices (Id),
        CONSTRAINT FK_PlaneLikeLogs_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PlaneLikeLogs')
      AND name = N'IX_PlaneLikeLogs_UserDeviceId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlaneLikeLogs_UserDeviceId ON dbo.PlaneLikeLogs (UserDeviceId);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PlaneLikeLogs')
      AND name = N'IX_PlaneLikeLogs_AppUserId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlaneLikeLogs_AppUserId ON dbo.PlaneLikeLogs (AppUserId);
END;
GO

IF OBJECT_ID(N'dbo.PlaneReportLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlaneReportLogs
    (
        Id uniqueidentifier NOT NULL,
        PlaneId uniqueidentifier NOT NULL,
        UserDeviceId uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NULL,
        ReportReason nvarchar(50) NOT NULL,
        ReportDetail nvarchar(200) NULL,
        Status nvarchar(20) NOT NULL CONSTRAINT DF_PlaneReportLogs_Status DEFAULT (N'PENDING'),
        ReviewerAdminId uniqueidentifier NULL,
        ReviewRemark nvarchar(200) NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_PlaneReportLogs_CreateTime DEFAULT (SYSUTCDATETIME()),
        ReviewTime datetime2 NULL,
        CONSTRAINT PK_PlaneReportLogs PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_PlaneReportLogs_PlaneId_UserDeviceId UNIQUE NONCLUSTERED (PlaneId, UserDeviceId),
        CONSTRAINT FK_PlaneReportLogs_Planes_PlaneId FOREIGN KEY (PlaneId) REFERENCES dbo.Planes (Id) ON DELETE CASCADE,
        CONSTRAINT FK_PlaneReportLogs_UserDevices_UserDeviceId FOREIGN KEY (UserDeviceId) REFERENCES dbo.UserDevices (Id),
        CONSTRAINT FK_PlaneReportLogs_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id),
        CONSTRAINT FK_PlaneReportLogs_AdminUsers_ReviewerAdminId FOREIGN KEY (ReviewerAdminId) REFERENCES dbo.AdminUsers (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PlaneReportLogs')
      AND name = N'IX_PlaneReportLogs_Status_CreateTime'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlaneReportLogs_Status_CreateTime ON dbo.PlaneReportLogs (Status, CreateTime);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PlaneReportLogs')
      AND name = N'IX_PlaneReportLogs_ReviewerAdminId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlaneReportLogs_ReviewerAdminId ON dbo.PlaneReportLogs (ReviewerAdminId);
END;
GO

IF OBJECT_ID(N'dbo.PlanePickupLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PlanePickupLogs
    (
        Id uniqueidentifier NOT NULL,
        PlaneId uniqueidentifier NOT NULL,
        UserDeviceId uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NULL,
        PickupChannel nvarchar(20) NOT NULL CONSTRAINT DF_PlanePickupLogs_PickupChannel DEFAULT (N'APP'),
        PickupLocation nvarchar(50) NULL,
        IsFirstView bit NOT NULL CONSTRAINT DF_PlanePickupLogs_IsFirstView DEFAULT ((0)),
        CreateTime datetime2 NOT NULL CONSTRAINT DF_PlanePickupLogs_CreateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_PlanePickupLogs PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_PlanePickupLogs_Planes_PlaneId FOREIGN KEY (PlaneId) REFERENCES dbo.Planes (Id) ON DELETE CASCADE,
        CONSTRAINT FK_PlanePickupLogs_UserDevices_UserDeviceId FOREIGN KEY (UserDeviceId) REFERENCES dbo.UserDevices (Id),
        CONSTRAINT FK_PlanePickupLogs_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PlanePickupLogs')
      AND name = N'IX_PlanePickupLogs_PlaneId_CreateTime'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlanePickupLogs_PlaneId_CreateTime ON dbo.PlanePickupLogs (PlaneId, CreateTime);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PlanePickupLogs')
      AND name = N'IX_PlanePickupLogs_UserDeviceId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PlanePickupLogs_UserDeviceId ON dbo.PlanePickupLogs (UserDeviceId);
END;
GO

IF OBJECT_ID(N'dbo.AuthorNotifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuthorNotifications
    (
        Id uniqueidentifier NOT NULL,
        AppUserId uniqueidentifier NOT NULL,
        PlaneId uniqueidentifier NULL,
        CommentId uniqueidentifier NULL,
        NotificationType nvarchar(30) NOT NULL,
        Title nvarchar(100) NOT NULL,
        Content nvarchar(200) NOT NULL,
        PayloadJson nvarchar(max) NULL,
        IsRead bit NOT NULL CONSTRAINT DF_AuthorNotifications_IsRead DEFAULT ((0)),
        ReadTime datetime2 NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_AuthorNotifications_CreateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_AuthorNotifications PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_AuthorNotifications_AppUsers_AppUserId FOREIGN KEY (AppUserId) REFERENCES dbo.AppUsers (Id) ON DELETE CASCADE,
        CONSTRAINT FK_AuthorNotifications_Planes_PlaneId FOREIGN KEY (PlaneId) REFERENCES dbo.Planes (Id),
        CONSTRAINT FK_AuthorNotifications_Comments_CommentId FOREIGN KEY (CommentId) REFERENCES dbo.Comments (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.AuthorNotifications')
      AND name = N'IX_AuthorNotifications_AppUserId_IsRead_CreateTime'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuthorNotifications_AppUserId_IsRead_CreateTime
        ON dbo.AuthorNotifications (AppUserId, IsRead, CreateTime DESC);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.AuthorNotifications')
      AND name = N'IX_AuthorNotifications_PlaneId'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_AuthorNotifications_PlaneId ON dbo.AuthorNotifications (PlaneId);
END;
GO

IF OBJECT_ID(N'dbo.SensitiveWords', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SensitiveWords
    (
        Id uniqueidentifier NOT NULL,
        Word nvarchar(100) NOT NULL,
        NormalizedWord nvarchar(100) NOT NULL,
        Category nvarchar(30) NOT NULL CONSTRAINT DF_SensitiveWords_Category DEFAULT (N'GENERAL'),
        MatchMode nvarchar(20) NOT NULL CONSTRAINT DF_SensitiveWords_MatchMode DEFAULT (N'CONTAINS'),
        HandleMode nvarchar(20) NOT NULL CONSTRAINT DF_SensitiveWords_HandleMode DEFAULT (N'BLOCK'),
        ReplaceText nvarchar(50) NULL,
        Scope nvarchar(50) NOT NULL CONSTRAINT DF_SensitiveWords_Scope DEFAULT (N'PLANE,COMMENT,NICKNAME'),
        Severity int NOT NULL CONSTRAINT DF_SensitiveWords_Severity DEFAULT ((3)),
        Priority int NOT NULL CONSTRAINT DF_SensitiveWords_Priority DEFAULT ((100)),
        IsEnabled bit NOT NULL CONSTRAINT DF_SensitiveWords_IsEnabled DEFAULT ((1)),
        Remark nvarchar(200) NULL,
        CreateAdminId uniqueidentifier NULL,
        UpdateAdminId uniqueidentifier NULL,
        CreateTime datetime2 NOT NULL CONSTRAINT DF_SensitiveWords_CreateTime DEFAULT (SYSUTCDATETIME()),
        UpdateTime datetime2 NOT NULL CONSTRAINT DF_SensitiveWords_UpdateTime DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_SensitiveWords PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_SensitiveWords_NormalizedWord UNIQUE NONCLUSTERED (NormalizedWord),
        CONSTRAINT FK_SensitiveWords_AdminUsers_CreateAdminId FOREIGN KEY (CreateAdminId) REFERENCES dbo.AdminUsers (Id),
        CONSTRAINT FK_SensitiveWords_AdminUsers_UpdateAdminId FOREIGN KEY (UpdateAdminId) REFERENCES dbo.AdminUsers (Id)
    );
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.SensitiveWords')
      AND name = N'IX_SensitiveWords_IsEnabled_Priority'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_SensitiveWords_IsEnabled_Priority ON dbo.SensitiveWords (IsEnabled, Priority);
END;
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.SensitiveWords')
      AND name = N'IX_SensitiveWords_Category'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_SensitiveWords_Category ON dbo.SensitiveWords (Category);
END;
GO

EXEC dbo.__SetTableComment N'__EFMigrationsHistory', N'EF Core 迁移历史表，记录数据库已经执行过的迁移版本';
EXEC dbo.__SetColumnComment N'__EFMigrationsHistory', N'MigrationId', N'迁移唯一标识，通常由时间戳和迁移名称组成';
EXEC dbo.__SetColumnComment N'__EFMigrationsHistory', N'ProductVersion', N'生成该迁移时使用的 EF Core 版本号';

EXEC dbo.__SetTableComment N'Planes', N'纸飞机主表，保存用户投递的纸飞机内容、状态和聚合统计';
EXEC dbo.__SetColumnComment N'Planes', N'Id', N'纸飞机主键';
EXEC dbo.__SetColumnComment N'Planes', N'LocationTag', N'纸飞机投递或降落的地点标签';
EXEC dbo.__SetColumnComment N'Planes', N'Content', N'纸飞机正文内容';
EXEC dbo.__SetColumnComment N'Planes', N'Mood', N'纸飞机情绪标签';
EXEC dbo.__SetColumnComment N'Planes', N'IsAnonymous', N'是否匿名投递，1 表示匿名，0 表示实名';
EXEC dbo.__SetColumnComment N'Planes', N'AuthorName', N'实名投递时展示给前端的作者昵称';
EXEC dbo.__SetColumnComment N'Planes', N'ImageUrlsJson', N'纸飞机图片地址 JSON 数组，后续可平滑迁移到 PlaneMediaAssets 表';
EXEC dbo.__SetColumnComment N'Planes', N'CreateTime', N'纸飞机创建时间（UTC）';
EXEC dbo.__SetColumnComment N'Planes', N'ExpireTime', N'纸飞机过期时间（UTC）';
EXEC dbo.__SetColumnComment N'Planes', N'PickCount', N'纸飞机被拾取或打开的累计次数';
EXEC dbo.__SetColumnComment N'Planes', N'IsDeleted', N'软删除标记，1 表示已下线或已删除';
EXEC dbo.__SetColumnComment N'Planes', N'ReportCount', N'纸飞机累计被举报次数';
EXEC dbo.__SetColumnComment N'Planes', N'LikeCount', N'纸飞机累计点赞次数';
EXEC dbo.__SetColumnComment N'Planes', N'VoteTitle', N'纸飞机携带的投票标题';
EXEC dbo.__SetColumnComment N'Planes', N'VoteOptionsJson', N'纸飞机投票选项 JSON 数组';

EXEC dbo.__SetTableComment N'Comments', N'纸飞机评论表，保存评论内容以及评论之间的父子回复关系';
EXEC dbo.__SetColumnComment N'Comments', N'Id', N'评论主键';
EXEC dbo.__SetColumnComment N'Comments', N'PlaneId', N'所属纸飞机主键';
EXEC dbo.__SetColumnComment N'Comments', N'Reply', N'评论或回复正文';
EXEC dbo.__SetColumnComment N'Comments', N'NickName', N'评论显示昵称，可能为匿名昵称也可能为实名昵称';
EXEC dbo.__SetColumnComment N'Comments', N'CreateTime', N'评论创建时间（UTC）';
EXEC dbo.__SetColumnComment N'Comments', N'ParentCommentId', N'父评论主键，为空时表示顶级评论';

EXEC dbo.__SetTableComment N'PlaneAttitudeVotes', N'纸飞机态度投票表，保存每个设备对某条纸飞机的单次投票选择';
EXEC dbo.__SetColumnComment N'PlaneAttitudeVotes', N'Id', N'态度投票主键';
EXEC dbo.__SetColumnComment N'PlaneAttitudeVotes', N'PlaneId', N'所属纸飞机主键';
EXEC dbo.__SetColumnComment N'PlaneAttitudeVotes', N'VoterKey', N'前端本地生成的投票身份键，用于限制单设备重复投票';
EXEC dbo.__SetColumnComment N'PlaneAttitudeVotes', N'OptionKey', N'当前投出的选项值';
EXEC dbo.__SetColumnComment N'PlaneAttitudeVotes', N'CreateTime', N'投票创建时间（UTC）';
EXEC dbo.__SetColumnComment N'PlaneAttitudeVotes', N'UpdateTime', N'投票最后更新时间（UTC）';

EXEC dbo.__SetTableComment N'Locations', N'地点配置表，保存系统内允许投递和浏览的校园地点';
EXEC dbo.__SetColumnComment N'Locations', N'Id', N'地点主键';
EXEC dbo.__SetColumnComment N'Locations', N'Name', N'地点名称';
EXEC dbo.__SetColumnComment N'Locations', N'IsActive', N'地点是否启用，1 表示启用';
EXEC dbo.__SetColumnComment N'Locations', N'SortOrder', N'地点排序值，越小越靠前';
EXEC dbo.__SetColumnComment N'Locations', N'CreateTime', N'地点创建时间（UTC）';

EXEC dbo.__SetTableComment N'AdminUsers', N'后台管理员表，保存管理后台登录账号和权限信息';
EXEC dbo.__SetColumnComment N'AdminUsers', N'Id', N'管理员主键';
EXEC dbo.__SetColumnComment N'AdminUsers', N'UserName', N'后台登录账号';
EXEC dbo.__SetColumnComment N'AdminUsers', N'DisplayName', N'后台展示名称';
EXEC dbo.__SetColumnComment N'AdminUsers', N'PasswordHash', N'密码哈希值';
EXEC dbo.__SetColumnComment N'AdminUsers', N'PasswordSalt', N'密码盐值';
EXEC dbo.__SetColumnComment N'AdminUsers', N'Roles', N'角色编码列表，多个角色用逗号分隔';
EXEC dbo.__SetColumnComment N'AdminUsers', N'IsActive', N'管理员账号是否启用，1 表示启用';
EXEC dbo.__SetColumnComment N'AdminUsers', N'CreateTime', N'管理员账号创建时间（UTC）';
EXEC dbo.__SetColumnComment N'AdminUsers', N'LastLoginTime', N'最近一次登录时间（UTC）';

EXEC dbo.__SetTableComment N'AdminRefreshTokens', N'后台刷新令牌表，保存管理员登录后的刷新令牌生命周期信息';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'Id', N'刷新令牌主键';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'AdminUserId', N'所属管理员主键';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'Token', N'刷新令牌明文';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'ExpiresAt', N'刷新令牌过期时间（UTC）';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'CreatedAt', N'刷新令牌创建时间（UTC）';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'RevokedAt', N'刷新令牌撤销时间（UTC）';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'ReplacedByToken', N'被轮换后的下一枚刷新令牌值';
EXEC dbo.__SetColumnComment N'AdminRefreshTokens', N'CreatedByIp', N'创建该刷新令牌时记录的客户端 IP';

EXEC dbo.__SetTableComment N'AppUsers', N'前台用户表，为移动端或 H5 端用户建立稳定的服务端身份主档';
EXEC dbo.__SetColumnComment N'AppUsers', N'Id', N'前台用户主键';
EXEC dbo.__SetColumnComment N'AppUsers', N'UserNo', N'对外展示或排查使用的用户编号';
EXEC dbo.__SetColumnComment N'AppUsers', N'RegisterChannel', N'注册来源渠道，例如 UNIAPP、WEB';
EXEC dbo.__SetColumnComment N'AppUsers', N'Status', N'用户状态，例如 ACTIVE、DISABLED';
EXEC dbo.__SetColumnComment N'AppUsers', N'LastActiveTime', N'用户最近一次活跃时间（UTC）';
EXEC dbo.__SetColumnComment N'AppUsers', N'CreateTime', N'用户创建时间（UTC）';
EXEC dbo.__SetColumnComment N'AppUsers', N'UpdateTime', N'用户资料最后更新时间（UTC）';

EXEC dbo.__SetTableComment N'UserDevices', N'用户设备表，把前端本地 voterKey 或设备身份映射到服务端用户';
EXEC dbo.__SetColumnComment N'UserDevices', N'Id', N'设备记录主键';
EXEC dbo.__SetColumnComment N'UserDevices', N'AppUserId', N'所属前台用户主键';
EXEC dbo.__SetColumnComment N'UserDevices', N'DeviceKey', N'前端本地生成或上报的稳定设备键';
EXEC dbo.__SetColumnComment N'UserDevices', N'DeviceName', N'设备备注名或前端展示名';
EXEC dbo.__SetColumnComment N'UserDevices', N'Platform', N'设备平台，例如 ios、android、web';
EXEC dbo.__SetColumnComment N'UserDevices', N'AppVersion', N'应用版本号';
EXEC dbo.__SetColumnComment N'UserDevices', N'LastKnownIp', N'最近一次请求时记录的 IP 地址';
EXEC dbo.__SetColumnComment N'UserDevices', N'LastKnownLocation', N'最近一次上报的当前地点名称';
EXEC dbo.__SetColumnComment N'UserDevices', N'IsPrimary', N'是否为该用户的主设备';
EXEC dbo.__SetColumnComment N'UserDevices', N'IsActive', N'设备记录是否启用';
EXEC dbo.__SetColumnComment N'UserDevices', N'FirstSeenTime', N'设备首次出现时间（UTC）';
EXEC dbo.__SetColumnComment N'UserDevices', N'LastSeenTime', N'设备最近活跃时间（UTC）';

EXEC dbo.__SetTableComment N'UserPreferences', N'用户偏好表，用于承接前端原本保存在本地的主题、昵称和当前地点等轻量状态';
EXEC dbo.__SetColumnComment N'UserPreferences', N'Id', N'用户偏好主键';
EXEC dbo.__SetColumnComment N'UserPreferences', N'AppUserId', N'所属前台用户主键';
EXEC dbo.__SetColumnComment N'UserPreferences', N'ProfileName', N'前端展示昵称，对应当前本地 profileName';
EXEC dbo.__SetColumnComment N'UserPreferences', N'Theme', N'主题模式，例如 light、dark';
EXEC dbo.__SetColumnComment N'UserPreferences', N'CurrentLocation', N'用户当前偏好的校园地点，对应前端 currentLocation';
EXEC dbo.__SetColumnComment N'UserPreferences', N'Language', N'界面语言编码';
EXEC dbo.__SetColumnComment N'UserPreferences', N'NotificationEnabled', N'是否接收通知提醒';
EXEC dbo.__SetColumnComment N'UserPreferences', N'UpdateTime', N'偏好信息最后更新时间（UTC）';

EXEC dbo.__SetTableComment N'UserPlaneLinks', N'用户与纸飞机关系表，用于把我的飞机、收藏、历史归档等能力从本地存储迁移到服务端';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'Id', N'用户纸飞机关系主键';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'AppUserId', N'所属前台用户主键';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'PlaneId', N'关联纸飞机主键';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'SourceDeviceId', N'建立该关系时使用的设备主键';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'LinkType', N'关系类型，例如 THROWN、BOOKMARK、ARCHIVE';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'Remark', N'关系备注信息，便于后续扩展';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'CreateTime', N'关系创建时间（UTC）';
EXEC dbo.__SetColumnComment N'UserPlaneLinks', N'UpdateTime', N'关系最后更新时间（UTC）';

EXEC dbo.__SetTableComment N'UserDrafts', N'用户草稿表，用于承接投掷页本地草稿、临时图片选择和投票编辑内容';
EXEC dbo.__SetColumnComment N'UserDrafts', N'Id', N'草稿主键';
EXEC dbo.__SetColumnComment N'UserDrafts', N'AppUserId', N'所属前台用户主键';
EXEC dbo.__SetColumnComment N'UserDrafts', N'DeviceId', N'草稿所属设备主键，便于按设备恢复未发布内容';
EXEC dbo.__SetColumnComment N'UserDrafts', N'DraftType', N'草稿类型，例如 THROW_PLANE';
EXEC dbo.__SetColumnComment N'UserDrafts', N'DraftKey', N'草稿业务键，用于区分一个用户的多份草稿';
EXEC dbo.__SetColumnComment N'UserDrafts', N'PayloadJson', N'草稿完整内容 JSON，包含正文、地点、图片、投票等前端状态';
EXEC dbo.__SetColumnComment N'UserDrafts', N'IsAutoSaved', N'是否由自动保存机制写入';
EXEC dbo.__SetColumnComment N'UserDrafts', N'ExpireTime', N'草稿过期时间（UTC），为空表示长期保留';
EXEC dbo.__SetColumnComment N'UserDrafts', N'CreateTime', N'草稿创建时间（UTC）';
EXEC dbo.__SetColumnComment N'UserDrafts', N'UpdateTime', N'草稿最后更新时间（UTC）';

EXEC dbo.__SetTableComment N'PlaneMediaAssets', N'纸飞机媒体资源表，用于支持多图纸飞机并替代在主表中直接堆放图片 JSON';
EXEC dbo.__SetColumnComment N'PlaneMediaAssets', N'Id', N'媒体资源主键';
EXEC dbo.__SetColumnComment N'PlaneMediaAssets', N'PlaneId', N'所属纸飞机主键';
EXEC dbo.__SetColumnComment N'PlaneMediaAssets', N'AssetUrl', N'媒体资源访问地址';
EXEC dbo.__SetColumnComment N'PlaneMediaAssets', N'AssetType', N'媒体类型，例如 IMAGE';
EXEC dbo.__SetColumnComment N'PlaneMediaAssets', N'SortOrder', N'媒体在详情页中的展示顺序';
EXEC dbo.__SetColumnComment N'PlaneMediaAssets', N'Source', N'资源来源，例如 LOCAL_UPLOAD、OSS';
EXEC dbo.__SetColumnComment N'PlaneMediaAssets', N'CreateTime', N'媒体记录创建时间（UTC）';

EXEC dbo.__SetTableComment N'PlaneLikeLogs', N'纸飞机点赞明细表，用于限制单设备重复点赞并支持点赞撤销与精细统计';
EXEC dbo.__SetColumnComment N'PlaneLikeLogs', N'Id', N'点赞记录主键';
EXEC dbo.__SetColumnComment N'PlaneLikeLogs', N'PlaneId', N'被点赞的纸飞机主键';
EXEC dbo.__SetColumnComment N'PlaneLikeLogs', N'UserDeviceId', N'执行点赞动作的设备主键';
EXEC dbo.__SetColumnComment N'PlaneLikeLogs', N'AppUserId', N'执行点赞动作的前台用户主键，未绑定用户时可为空';
EXEC dbo.__SetColumnComment N'PlaneLikeLogs', N'IsCanceled', N'是否已撤销点赞';
EXEC dbo.__SetColumnComment N'PlaneLikeLogs', N'CancelTime', N'点赞撤销时间（UTC）';
EXEC dbo.__SetColumnComment N'PlaneLikeLogs', N'CreateTime', N'点赞创建时间（UTC）';

EXEC dbo.__SetTableComment N'PlaneReportLogs', N'纸飞机举报明细表，用于保存举报原因、审核状态和审核结果';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'Id', N'举报记录主键';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'PlaneId', N'被举报的纸飞机主键';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'UserDeviceId', N'发起举报的设备主键';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'AppUserId', N'发起举报的前台用户主键，未绑定用户时可为空';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'ReportReason', N'举报原因分类';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'ReportDetail', N'举报补充说明';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'Status', N'审核状态，例如 PENDING、APPROVED、REJECTED';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'ReviewerAdminId', N'处理该举报的管理员主键';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'ReviewRemark', N'管理员审核备注';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'CreateTime', N'举报创建时间（UTC）';
EXEC dbo.__SetColumnComment N'PlaneReportLogs', N'ReviewTime', N'举报审核完成时间（UTC）';

EXEC dbo.__SetTableComment N'PlanePickupLogs', N'纸飞机拾取明细表，用于记录谁在什么时间打开过纸飞机，为通知和统计提供依据';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'Id', N'拾取记录主键';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'PlaneId', N'被拾取的纸飞机主键';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'UserDeviceId', N'执行拾取动作的设备主键';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'AppUserId', N'执行拾取动作的前台用户主键，未绑定用户时可为空';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'PickupChannel', N'拾取来源渠道，例如 APP、WEB';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'PickupLocation', N'拾取时用户所在地点';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'IsFirstView', N'是否为该设备首次打开该纸飞机';
EXEC dbo.__SetColumnComment N'PlanePickupLogs', N'CreateTime', N'拾取创建时间（UTC）';

EXEC dbo.__SetTableComment N'AuthorNotifications', N'投掷者通知表，用于承接纸飞机被拾取、被评论、被举报等后续提醒能力';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'Id', N'通知主键';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'AppUserId', N'接收通知的前台用户主键';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'PlaneId', N'关联纸飞机主键';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'CommentId', N'关联评论主键';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'NotificationType', N'通知类型，例如 PICKED、COMMENTED、REPORTED';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'Title', N'通知标题';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'Content', N'通知正文';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'PayloadJson', N'通知附加数据 JSON，用于前端跳转或补充展示';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'IsRead', N'是否已读';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'ReadTime', N'通知已读时间（UTC）';
EXEC dbo.__SetColumnComment N'AuthorNotifications', N'CreateTime', N'通知创建时间（UTC）';

EXEC dbo.__SetTableComment N'SensitiveWords', N'敏感词库表，用于配置命中规则、处理方式和适用范围，供纸飞机正文、评论、昵称等内容审核使用';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'Id', N'敏感词主键';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'Word', N'原始敏感词内容';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'NormalizedWord', N'归一化后的敏感词，用于唯一约束和统一匹配';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'Category', N'敏感词分类，例如 GENERAL、ABUSE、ADS、CONTACT';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'MatchMode', N'匹配方式，例如 CONTAINS、EXACT、REGEX';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'HandleMode', N'处理方式，例如 BLOCK、REVIEW、REPLACE';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'ReplaceText', N'替换模式下用于替换原文的文本';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'Scope', N'生效范围，例如 PLANE、COMMENT、NICKNAME，多个范围可用逗号分隔';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'Severity', N'严重级别，数值越大表示越敏感';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'Priority', N'匹配优先级，数值越大越先处理';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'IsEnabled', N'是否启用该敏感词规则';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'Remark', N'规则备注说明';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'CreateAdminId', N'创建该规则的管理员主键';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'UpdateAdminId', N'最后修改该规则的管理员主键';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'CreateTime', N'规则创建时间（UTC）';
EXEC dbo.__SetColumnComment N'SensitiveWords', N'UpdateTime', N'规则最后更新时间（UTC）';
GO

IF OBJECT_ID(N'dbo.__SetColumnComment', N'P') IS NOT NULL
    DROP PROCEDURE dbo.__SetColumnComment;
GO

IF OBJECT_ID(N'dbo.__SetTableComment', N'P') IS NOT NULL
    DROP PROCEDURE dbo.__SetTableComment;
GO
