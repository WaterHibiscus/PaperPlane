# PaperPlane 数据库初始化

截至 2026-03-31，项目后端已经采用 `SQL Server + EF Core Migration` 管理数据库结构，连接串默认指向：

```json
"Server=localhost;Database=PaperPlane;Trusted_Connection=True;TrustServerCertificate=True;"
```

这份目录把“独立建库”和“独立建表”拆开了，方便你先把数据库准备好，再慢慢接业务代码。

## 文件说明

- `create_database.sql`
  - 只负责创建 `PaperPlane` 数据库本身。
- `init.sql`
  - 由 EF Core 迁移生成的幂等脚本。
  - 负责创建当前所有表、索引、外键、表注释和 `Locations` 初始数据。

## 初始化步骤

1. 在 `master` 库执行建库脚本：

```powershell
sqlcmd -S localhost -d master -i .\database\create_database.sql -C
```

2. 在 `PaperPlane` 库执行结构脚本：

```powershell
sqlcmd -S localhost -d PaperPlane -i .\database\init.sql -C
```

3. 如果你要通过程序自动补齐迁移和管理员种子数据，也可以直接运行后端：

```powershell
dotnet run
```

## 当前数据库包含的核心表

- `Planes`
  - 纸飞机主表，保存内容、地点、心情、实名/匿名、过期时间、点赞数、举报数、投票配置。
- `Comments`
  - 评论与回复表，支持 `ParentCommentId` 形成楼中楼。
- `PlaneAttitudeVotes`
  - 单机标识 `VoterKey` 对单条纸飞机的投票记录。
- `Locations`
  - 投递地点配置表，已内置图书馆、食堂、操场、教学楼、宿舍楼、校门口 6 个地点。
- `AdminUsers`
  - 后台管理员账号。
- `AdminRefreshTokens`
  - 后台登录刷新令牌。

## 现阶段数据库还建议补的表

下面这些不是“现在必须立刻建”，但从你项目定位来看，后面非常值得加：

- `PlaneReportLogs`
  - 现在只有 `Planes.ReportCount` 总数，没有举报明细。
  - 缺点是无法防止同一设备重复举报，也无法追踪谁、何时、因为什么原因举报。
- `AuthorNotifications`
  - 需求里提到“纸飞机被打开、被回复时给投掷者提醒”，现在数据库里还没有通知落表。
  - 后面做消息中心、未读数、回访提醒都会需要它。
- `ClientProfiles` 或 `DeviceProfiles`
  - 目前“我的飞机”“评论昵称”“投票身份”基本都还靠前端本地存储。
  - 一旦用户换设备或清缓存，历史就丢了；服务端落一张轻量身份表会更稳。

## 一个重要说明

`init.sql` 会创建结构和地点种子数据，但不会直接插入默认管理员账号。

默认管理员目前由后端启动时的 `AdminSeeder` 写入。如果你后面想完全脱离程序、纯 SQL 初始化管理员，可以再单独补一份 `seed_admin.sql`，但那一步最好和密码加密方案一起定下来再做。
