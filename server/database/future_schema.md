# Future Schema 说明

这份扩展方案遵循两个原则：

- 不改你现有业务表的字段结构，不清空现有数据。
- 先把后续高概率会用到的表建好，等你后面接代码时直接用。

## 新增脚本

- `future_schema.sql`
  - 给现有表和现有字段补齐数据库注释。
  - 新增未来扩展表。
  - 整个脚本是幂等的，可以重复执行。

执行方式：

```powershell
sqlcmd -S localhost -d PaperPlane -i .\database\future_schema.sql -C
```

## 这次新增的表

- `AppUsers`
  - 前台用户主表，解决“用户表还没有”的问题。
- `UserDevices`
  - 把前端本地 `voterKey`、设备身份和用户绑定起来。
- `UserPreferences`
  - 承接 `profileName`、`theme`、`currentLocation` 这类用户偏好。
- `UserPlaneLinks`
  - 承接前端本地 `myPlaneIds`，后面也能扩展收藏、归档。
- `UserDrafts`
  - 承接投掷页草稿，包括正文、地点、投票和已选图片。
- `PlaneMediaAssets`
  - 预留图片资源表，后续多图纸飞机可以直接走这张表。
- `PlaneLikeLogs`
  - 点赞明细，后续可以防重复点赞、做撤销点赞。
- `PlaneReportLogs`
  - 举报明细，后续可以记原因、记审核状态。
- `PlanePickupLogs`
  - 拾取明细，后续可以支持“谁打开了我的纸飞机”的提醒。
- `AuthorNotifications`
  - 投掷者通知中心。
- `SensitiveWords`
  - 敏感词库主表，后面可以把正文、评论、昵称的内容审核统一从这里读取。

## 前端本地数据与数据库映射

- `paperplane_profile_name`
  - 对应 `UserPreferences.ProfileName`
- `paperplane_theme`
  - 对应 `UserPreferences.Theme`
- `paperplane_current_location`
  - 对应 `UserPreferences.CurrentLocation`
- `paperplane_voter_key`
  - 对应 `UserDevices.DeviceKey`
- `paperplane_my_plane_ids`
  - 对应 `UserPlaneLinks`
- `paperplane_throw_draft`
  - 对应 `UserDrafts.PayloadJson`
- `selectedImages`
  - 草稿阶段先存 `UserDrafts.PayloadJson`
  - 发布后可正式落到 `PlaneMediaAssets`

## 注释策略

脚本已经覆盖：

- 现有表注释
- 现有字段注释
- 新增表注释
- 新增字段注释

注释通过 SQL Server 的 `MS_Description` 扩展属性写入，后面你在数据库工具里就能直接看到表说明和字段说明。
