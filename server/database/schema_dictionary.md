# PaperPlane 数据字典

截至 2026-03-31，当前 `PaperPlane` 数据库包含以下表结构。

## `__EFMigrationsHistory`

表说明：EF Core 迁移历史表，记录数据库已经执行过的迁移版本

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `MigrationId` | `nvarchar(150)` | 迁移唯一标识，通常由时间戳和迁移名称组成 |
| `ProductVersion` | `nvarchar(32)` | 生成该迁移时使用的 EF Core 版本号 |

## `AdminRefreshTokens`

表说明：后台刷新令牌表，保存管理员登录后的刷新令牌生命周期信息

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 刷新令牌主键 |
| `AdminUserId` | `uniqueidentifier` | 所属管理员主键 |
| `Token` | `nvarchar(200)` | 刷新令牌明文 |
| `ExpiresAt` | `datetime2(7)` | 刷新令牌过期时间（UTC） |
| `CreatedAt` | `datetime2(7)` | 刷新令牌创建时间（UTC） |
| `RevokedAt` | `datetime2(7)` | 刷新令牌撤销时间（UTC） |
| `ReplacedByToken` | `nvarchar(200)` | 被轮换后的下一枚刷新令牌值 |
| `CreatedByIp` | `nvarchar(45)` | 创建该刷新令牌时记录的客户端 IP |

## `AdminUsers`

表说明：后台管理员表，保存管理后台登录账号和权限信息

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 管理员主键 |
| `UserName` | `nvarchar(50)` | 后台登录账号 |
| `DisplayName` | `nvarchar(50)` | 后台展示名称 |
| `PasswordHash` | `nvarchar(200)` | 密码哈希值 |
| `PasswordSalt` | `nvarchar(200)` | 密码盐值 |
| `Roles` | `nvarchar(200)` | 角色编码列表，多个角色用逗号分隔 |
| `IsActive` | `bit` | 管理员账号是否启用，1 表示启用 |
| `CreateTime` | `datetime2(7)` | 管理员账号创建时间（UTC） |
| `LastLoginTime` | `datetime2(7)` | 最近一次登录时间（UTC） |

## `AppUsers`

表说明：前台用户表，为移动端或 H5 端用户建立稳定的服务端身份主档

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 前台用户主键 |
| `UserNo` | `nvarchar(50)` | 对外展示或排查使用的用户编号 |
| `RegisterChannel` | `nvarchar(20)` | 注册来源渠道，例如 UNIAPP、WEB |
| `Status` | `nvarchar(20)` | 用户状态，例如 ACTIVE、DISABLED |
| `LastActiveTime` | `datetime2(7)` | 用户最近一次活跃时间（UTC） |
| `CreateTime` | `datetime2(7)` | 用户创建时间（UTC） |
| `UpdateTime` | `datetime2(7)` | 用户资料最后更新时间（UTC） |

## `AuthorNotifications`

表说明：投掷者通知表，用于承接纸飞机被拾取、被评论、被举报等后续提醒能力

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 通知主键 |
| `AppUserId` | `uniqueidentifier` | 接收通知的前台用户主键 |
| `PlaneId` | `uniqueidentifier` | 关联纸飞机主键 |
| `CommentId` | `uniqueidentifier` | 关联评论主键 |
| `NotificationType` | `nvarchar(30)` | 通知类型，例如 PICKED、COMMENTED、REPORTED |
| `Title` | `nvarchar(100)` | 通知标题 |
| `Content` | `nvarchar(200)` | 通知正文 |
| `PayloadJson` | `nvarchar(max)` | 通知附加数据 JSON，用于前端跳转或补充展示 |
| `IsRead` | `bit` | 是否已读 |
| `ReadTime` | `datetime2(7)` | 通知已读时间（UTC） |
| `CreateTime` | `datetime2(7)` | 通知创建时间（UTC） |

## `Comments`

表说明：纸飞机评论表，保存评论内容以及评论之间的父子回复关系

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 评论主键 |
| `PlaneId` | `uniqueidentifier` | 所属纸飞机主键 |
| `Reply` | `nvarchar(200)` | 评论或回复正文 |
| `NickName` | `nvarchar(30)` | 评论显示昵称，可能为匿名昵称也可能为实名昵称 |
| `CreateTime` | `datetime2(7)` | 评论创建时间（UTC） |
| `ParentCommentId` | `uniqueidentifier` | 父评论主键，为空时表示顶级评论 |

## `Locations`

表说明：地点配置表，保存系统内允许投递和浏览的校园地点

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `int` | 地点主键 |
| `Name` | `nvarchar(50)` | 地点名称 |
| `IsActive` | `bit` | 地点是否启用，1 表示启用 |
| `SortOrder` | `int` | 地点排序值，越小越靠前 |
| `CreateTime` | `datetime2(7)` | 地点创建时间（UTC） |

## `PlaneAttitudeVotes`

表说明：纸飞机态度投票表，保存每个设备对某条纸飞机的单次投票选择

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 态度投票主键 |
| `PlaneId` | `uniqueidentifier` | 所属纸飞机主键 |
| `VoterKey` | `nvarchar(100)` | 前端本地生成的投票身份键，用于限制单设备重复投票 |
| `OptionKey` | `nvarchar(30)` | 当前投出的选项值 |
| `CreateTime` | `datetime2(7)` | 投票创建时间（UTC） |
| `UpdateTime` | `datetime2(7)` | 投票最后更新时间（UTC） |

## `PlaneLikeLogs`

表说明：纸飞机点赞明细表，用于限制单设备重复点赞并支持点赞撤销与精细统计

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 点赞记录主键 |
| `PlaneId` | `uniqueidentifier` | 被点赞的纸飞机主键 |
| `UserDeviceId` | `uniqueidentifier` | 执行点赞动作的设备主键 |
| `AppUserId` | `uniqueidentifier` | 执行点赞动作的前台用户主键，未绑定用户时可为空 |
| `IsCanceled` | `bit` | 是否已撤销点赞 |
| `CancelTime` | `datetime2(7)` | 点赞撤销时间（UTC） |
| `CreateTime` | `datetime2(7)` | 点赞创建时间（UTC） |

## `PlaneMediaAssets`

表说明：纸飞机媒体资源表，用于支持多图纸飞机并替代在主表中直接堆放图片 JSON

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 媒体资源主键 |
| `PlaneId` | `uniqueidentifier` | 所属纸飞机主键 |
| `AssetUrl` | `nvarchar(500)` | 媒体资源访问地址 |
| `AssetType` | `nvarchar(20)` | 媒体类型，例如 IMAGE |
| `SortOrder` | `int` | 媒体在详情页中的展示顺序 |
| `Source` | `nvarchar(20)` | 资源来源，例如 LOCAL_UPLOAD、OSS |
| `CreateTime` | `datetime2(7)` | 媒体记录创建时间（UTC） |

## `PlanePickupLogs`

表说明：纸飞机拾取明细表，用于记录谁在什么时间打开过纸飞机，为通知和统计提供依据

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 拾取记录主键 |
| `PlaneId` | `uniqueidentifier` | 被拾取的纸飞机主键 |
| `UserDeviceId` | `uniqueidentifier` | 执行拾取动作的设备主键 |
| `AppUserId` | `uniqueidentifier` | 执行拾取动作的前台用户主键，未绑定用户时可为空 |
| `PickupChannel` | `nvarchar(20)` | 拾取来源渠道，例如 APP、WEB |
| `PickupLocation` | `nvarchar(50)` | 拾取时用户所在地点 |
| `IsFirstView` | `bit` | 是否为该设备首次打开该纸飞机 |
| `CreateTime` | `datetime2(7)` | 拾取创建时间（UTC） |

## `PlaneReportLogs`

表说明：纸飞机举报明细表，用于保存举报原因、审核状态和审核结果

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 举报记录主键 |
| `PlaneId` | `uniqueidentifier` | 被举报的纸飞机主键 |
| `UserDeviceId` | `uniqueidentifier` | 发起举报的设备主键 |
| `AppUserId` | `uniqueidentifier` | 发起举报的前台用户主键，未绑定用户时可为空 |
| `ReportReason` | `nvarchar(50)` | 举报原因分类 |
| `ReportDetail` | `nvarchar(200)` | 举报补充说明 |
| `Status` | `nvarchar(20)` | 审核状态，例如 PENDING、APPROVED、REJECTED |
| `ReviewerAdminId` | `uniqueidentifier` | 处理该举报的管理员主键 |
| `ReviewRemark` | `nvarchar(200)` | 管理员审核备注 |
| `CreateTime` | `datetime2(7)` | 举报创建时间（UTC） |
| `ReviewTime` | `datetime2(7)` | 举报审核完成时间（UTC） |

## `Planes`

表说明：纸飞机主表，保存用户投递的纸飞机内容、状态和聚合统计

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 纸飞机主键 |
| `LocationTag` | `nvarchar(50)` | 纸飞机投递或降落的地点标签 |
| `Content` | `nvarchar(200)` | 纸飞机正文内容 |
| `Mood` | `nvarchar(20)` | 纸飞机情绪标签 |
| `CreateTime` | `datetime2(7)` | 纸飞机创建时间（UTC） |
| `ExpireTime` | `datetime2(7)` | 纸飞机过期时间（UTC） |
| `PickCount` | `int` | 纸飞机被拾取或打开的累计次数 |
| `IsDeleted` | `bit` | 软删除标记，1 表示已下线或已删除 |
| `ReportCount` | `int` | 纸飞机累计被举报次数 |
| `LikeCount` | `int` | 纸飞机累计点赞次数 |
| `VoteTitle` | `nvarchar(60)` | 纸飞机携带的投票标题 |
| `VoteOptionsJson` | `nvarchar(max)` | 纸飞机投票选项 JSON 数组 |
| `AuthorName` | `nvarchar(30)` | 实名投递时展示给前端的作者昵称 |
| `IsAnonymous` | `bit` | 是否匿名投递，1 表示匿名，0 表示实名 |
| `ImageUrlsJson` | `nvarchar(max)` | 纸飞机图片地址 JSON 数组，后续可平滑迁移到 PlaneMediaAssets 表 |

## `SensitiveWords`

表说明：敏感词库表，用于配置命中规则、处理方式和适用范围，供纸飞机正文、评论、昵称等内容审核使用

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 敏感词主键 |
| `Word` | `nvarchar(100)` | 原始敏感词内容 |
| `NormalizedWord` | `nvarchar(100)` | 归一化后的敏感词，用于唯一约束和统一匹配 |
| `Category` | `nvarchar(30)` | 敏感词分类，例如 GENERAL、ABUSE、ADS、CONTACT |
| `MatchMode` | `nvarchar(20)` | 匹配方式，例如 CONTAINS、EXACT、REGEX |
| `HandleMode` | `nvarchar(20)` | 处理方式，例如 BLOCK、REVIEW、REPLACE |
| `ReplaceText` | `nvarchar(50)` | 替换模式下用于替换原文的文本 |
| `Scope` | `nvarchar(50)` | 生效范围，例如 PLANE、COMMENT、NICKNAME，多个范围可用逗号分隔 |
| `Severity` | `int` | 严重级别，数值越大表示越敏感 |
| `Priority` | `int` | 匹配优先级，数值越大越先处理 |
| `IsEnabled` | `bit` | 是否启用该敏感词规则 |
| `Remark` | `nvarchar(200)` | 规则备注说明 |
| `CreateAdminId` | `uniqueidentifier` | 创建该规则的管理员主键 |
| `UpdateAdminId` | `uniqueidentifier` | 最后修改该规则的管理员主键 |
| `CreateTime` | `datetime2(7)` | 规则创建时间（UTC） |
| `UpdateTime` | `datetime2(7)` | 规则最后更新时间（UTC） |

## `UserDevices`

表说明：用户设备表，把前端本地 voterKey 或设备身份映射到服务端用户

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 设备记录主键 |
| `AppUserId` | `uniqueidentifier` | 所属前台用户主键 |
| `DeviceKey` | `nvarchar(100)` | 前端本地生成或上报的稳定设备键 |
| `DeviceName` | `nvarchar(50)` | 设备备注名或前端展示名 |
| `Platform` | `nvarchar(30)` | 设备平台，例如 ios、android、web |
| `AppVersion` | `nvarchar(30)` | 应用版本号 |
| `LastKnownIp` | `nvarchar(45)` | 最近一次请求时记录的 IP 地址 |
| `LastKnownLocation` | `nvarchar(50)` | 最近一次上报的当前地点名称 |
| `IsPrimary` | `bit` | 是否为该用户的主设备 |
| `IsActive` | `bit` | 设备记录是否启用 |
| `FirstSeenTime` | `datetime2(7)` | 设备首次出现时间（UTC） |
| `LastSeenTime` | `datetime2(7)` | 设备最近活跃时间（UTC） |

## `UserDrafts`

表说明：用户草稿表，用于承接投掷页本地草稿、临时图片选择和投票编辑内容

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 草稿主键 |
| `AppUserId` | `uniqueidentifier` | 所属前台用户主键 |
| `DeviceId` | `uniqueidentifier` | 草稿所属设备主键，便于按设备恢复未发布内容 |
| `DraftType` | `nvarchar(20)` | 草稿类型，例如 THROW_PLANE |
| `DraftKey` | `nvarchar(50)` | 草稿业务键，用于区分一个用户的多份草稿 |
| `PayloadJson` | `nvarchar(max)` | 草稿完整内容 JSON，包含正文、地点、图片、投票等前端状态 |
| `IsAutoSaved` | `bit` | 是否由自动保存机制写入 |
| `ExpireTime` | `datetime2(7)` | 草稿过期时间（UTC），为空表示长期保留 |
| `CreateTime` | `datetime2(7)` | 草稿创建时间（UTC） |
| `UpdateTime` | `datetime2(7)` | 草稿最后更新时间（UTC） |

## `UserPlaneLinks`

表说明：用户与纸飞机关系表，用于把我的飞机、收藏、历史归档等能力从本地存储迁移到服务端

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 用户纸飞机关系主键 |
| `AppUserId` | `uniqueidentifier` | 所属前台用户主键 |
| `PlaneId` | `uniqueidentifier` | 关联纸飞机主键 |
| `SourceDeviceId` | `uniqueidentifier` | 建立该关系时使用的设备主键 |
| `LinkType` | `nvarchar(20)` | 关系类型，例如 THROWN、BOOKMARK、ARCHIVE |
| `Remark` | `nvarchar(100)` | 关系备注信息，便于后续扩展 |
| `CreateTime` | `datetime2(7)` | 关系创建时间（UTC） |
| `UpdateTime` | `datetime2(7)` | 关系最后更新时间（UTC） |

## `UserPreferences`

表说明：用户偏好表，用于承接前端原本保存在本地的主题、昵称和当前地点等轻量状态

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 用户偏好主键 |
| `AppUserId` | `uniqueidentifier` | 所属前台用户主键 |
| `ProfileName` | `nvarchar(30)` | 前端展示昵称，对应当前本地 profileName |
| `Theme` | `nvarchar(20)` | 主题模式，例如 light、dark |
| `CurrentLocation` | `nvarchar(50)` | 用户当前偏好的校园地点，对应前端 currentLocation |
| `Language` | `nvarchar(20)` | 界面语言编码 |
| `NotificationEnabled` | `bit` | 是否接收通知提醒 |
| `UpdateTime` | `datetime2(7)` | 偏好信息最后更新时间（UTC） |

## 你给出的命中日志表结构建议

如果你后面还要加“敏感词命中日志表”，你刚刚给出的这版结构本身是合理的，我按 Markdown 帮你整理好了：

### `SensitiveWordHitLogs`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `Id` | `uniqueidentifier` | 主键 |
| `SensitiveWordId` | `uniqueidentifier` | 命中的敏感词主键 |
| `ContentType` | `nvarchar(20)` | 命中内容类型：PLANE / COMMENT / NICKNAME |
| `TargetId` | `uniqueidentifier` | 对应内容主键，比如 PlaneId 或 CommentId |
| `OriginalText` | `nvarchar(500)` | 被检测文本片段或原文摘要 |
| `MatchedText` | `nvarchar(100)` | 实际命中的词 |
| `HandleMode` | `nvarchar(20)` | 当时采用的处理方式 |
| `Status` | `nvarchar(20)` | 结果状态，比如 BLOCKED、REVIEWED、PASSED |
| `CreateTime` | `datetime2` | 命中时间 |
