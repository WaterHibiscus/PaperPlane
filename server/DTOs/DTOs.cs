namespace server.DTOs;

/// <summary>
/// 投递纸飞机请求。
/// </summary>
/// <param name="LocationTag">投递地点标签。</param>
/// <param name="Content">纸飞机正文内容。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="IsAnonymous">是否匿名投递。</param>
/// <param name="AuthorName">实名投递时填写的作者昵称。</param>
/// <param name="ImageUrls">已上传图片的访问地址列表。</param>
/// <param name="ExpireHours">存活时长，单位小时。</param>
/// <param name="VoteTitle">附带投票的标题。</param>
/// <param name="VoteOptions">附带投票的选项列表。</param>
public record ThrowPlaneRequest(
    string LocationTag,
    string Content,
    string Mood,
    bool IsAnonymous = true,
    string? AuthorName = null,
    List<string>? ImageUrls = null,
    int ExpireHours = 24,
    string? VoteTitle = null,
    List<string>? VoteOptions = null);

/// <summary>
/// 更新纸飞机请求。
/// </summary>
/// <param name="LocationTag">纸飞机地点标签。</param>
/// <param name="Content">纸飞机正文内容。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="IsAnonymous">是否匿名展示。</param>
/// <param name="AuthorName">实名展示时使用的作者昵称。</param>
/// <param name="ImageUrls">图片访问地址列表。</param>
/// <param name="ExpireHours">存活时长，单位小时。</param>
/// <param name="VoteTitle">投票标题。</param>
/// <param name="VoteOptions">投票选项列表。</param>
public record UpdatePlaneRequest(
    string LocationTag,
    string Content,
    string Mood,
    bool IsAnonymous = true,
    string? AuthorName = null,
    List<string>? ImageUrls = null,
    int ExpireHours = 24,
    string? VoteTitle = null,
    List<string>? VoteOptions = null);

/// <summary>
/// 纸飞机详情响应。
/// </summary>
/// <param name="Id">纸飞机主键 ID。</param>
/// <param name="ShortCode">纸飞机短号。</param>
/// <param name="LocationTag">地点标签。</param>
/// <param name="Content">正文内容。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="IsAnonymous">是否匿名。</param>
/// <param name="AuthorName">作者昵称。</param>
/// <param name="ImageUrls">图片访问地址列表。</param>
/// <param name="CreateTime">创建时间。</param>
/// <param name="ExpireTime">过期时间。</param>
/// <param name="PickCount">被捞起次数。</param>
/// <param name="LikeCount">点赞次数。</param>
/// <param name="CommentCount">评论数。</param>
/// <param name="ReportCount">举报数。</param>
/// <param name="VoteTitle">投票标题。</param>
/// <param name="VoteOptions">投票选项列表。</param>
public record PlaneResponse(
    Guid Id,
    string ShortCode,
    string LocationTag,
    string Content,
    string Mood,
    bool IsAnonymous,
    string? AuthorName,
    List<string>? ImageUrls,
    DateTime CreateTime,
    DateTime ExpireTime,
    int PickCount,
    int LikeCount,
    int CommentCount,
    int ReportCount,
    string? VoteTitle = null,
    List<string>? VoteOptions = null);

/// <summary>
/// 被举报纸飞机响应。
/// </summary>
/// <param name="Id">纸飞机主键 ID。</param>
/// <param name="ShortCode">纸飞机短号。</param>
/// <param name="LocationTag">地点标签。</param>
/// <param name="Content">正文内容。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="IsAnonymous">是否匿名。</param>
/// <param name="AuthorName">作者昵称。</param>
/// <param name="ImageUrls">图片访问地址列表。</param>
/// <param name="CreateTime">创建时间。</param>
/// <param name="ExpireTime">过期时间。</param>
/// <param name="PickCount">被捞起次数。</param>
/// <param name="LikeCount">点赞次数。</param>
/// <param name="CommentCount">评论数。</param>
/// <param name="ReportCount">举报数。</param>
/// <param name="IsDeleted">是否已删除。</param>
/// <param name="VoteTitle">投票标题。</param>
/// <param name="VoteOptions">投票选项列表。</param>
/// <param name="LatestReportReason">最近一次举报原因枚举值。</param>
/// <param name="LatestReportDetail">最近一次举报补充说明。</param>
/// <param name="LatestReportedAt">最近一次举报时间。</param>
public record ReportedPlaneResponse(
    Guid Id,
    string ShortCode,
    string LocationTag,
    string Content,
    string Mood,
    bool IsAnonymous,
    string? AuthorName,
    List<string>? ImageUrls,
    DateTime CreateTime,
    DateTime ExpireTime,
    int PickCount,
    int LikeCount,
    int CommentCount,
    int ReportCount,
    bool IsDeleted,
    string? VoteTitle = null,
    List<string>? VoteOptions = null,
    string? LatestReportReason = null,
    string? LatestReportDetail = null,
    DateTime? LatestReportedAt = null);

/// <summary>
/// 随机候选纸飞机项。
/// </summary>
/// <param name="OrderIndex">候选序号。</param>
/// <param name="Id">纸飞机 ID。</param>
/// <param name="ShortCode">纸飞机短号。</param>
/// <param name="LocationTag">地点标签。</param>
/// <param name="Content">正文内容。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="CreateTime">创建时间。</param>
/// <param name="ExpireTime">过期时间。</param>
/// <param name="RecalledAt">撤回时间。</param>
/// <param name="Status">状态文本。</param>
/// <param name="IsExpired">是否已过期。</param>
/// <param name="IsRecalled">是否已撤回。</param>
/// <param name="PickCount">被捞起次数。</param>
/// <param name="LikeCount">点赞次数。</param>
/// <param name="CommentCount">评论数。</param>
/// <param name="ReportCount">举报数。</param>
public record RandomCandidateItemResponse(
    int OrderIndex,
    Guid Id,
    string ShortCode,
    string LocationTag,
    string Content,
    string Mood,
    DateTime CreateTime,
    DateTime ExpireTime,
    DateTime? RecalledAt,
    string Status,
    bool IsExpired,
    bool IsRecalled,
    int PickCount,
    int LikeCount,
    int CommentCount,
    int ReportCount);

/// <summary>
/// 随机候选纸飞机列表响应。
/// </summary>
/// <param name="CurrentUtcTime">服务端当前 UTC 时间。</param>
/// <param name="Total">候选总数。</param>
/// <param name="Items">候选列表。</param>
public record RandomCandidateListResponse(
    DateTime CurrentUtcTime,
    int Total,
    List<RandomCandidateItemResponse> Items);

/// <summary>
/// 新增评论或回复请求。
/// </summary>
/// <param name="Reply">评论内容。</param>
/// <param name="IsAnonymous">是否匿名评论。</param>
/// <param name="NickName">非匿名评论时使用的昵称。</param>
/// <param name="ParentCommentId">父评论 ID，用于回复场景。</param>
public record AddCommentRequest(string Reply, bool IsAnonymous = true, string? NickName = null, Guid? ParentCommentId = null);

/// <summary>
/// 评论响应。
/// </summary>
/// <param name="Id">评论 ID。</param>
/// <param name="Reply">评论内容。</param>
/// <param name="NickName">评论昵称。</param>
/// <param name="CreateTime">评论时间。</param>
/// <param name="ParentCommentId">父评论 ID。</param>
/// <param name="ReplyToNickName">被回复用户昵称。</param>
public record CommentResponse(Guid Id, string Reply, string NickName, DateTime CreateTime, Guid? ParentCommentId = null, string? ReplyToNickName = null);

/// <summary>
/// 纸飞机态度投票请求。
/// </summary>
/// <param name="OptionKey">选中的态度选项标识。</param>
/// <param name="VoterKey">投票人标识。</param>
public record VotePlaneAttitudeRequest(string OptionKey, string VoterKey);

/// <summary>
/// 举报纸飞机请求。
/// </summary>
/// <param name="Reason">举报原因枚举值，例如 spam、abuse。</param>
/// <param name="Detail">举报补充说明。</param>
public record ReportPlaneRequest(string? Reason = null, string? Detail = null);

/// <summary>
/// 更新纸飞机上下线状态请求。
/// </summary>
/// <param name="IsOnline">是否上架展示。</param>
public record UpdatePlaneOnlineStatusRequest(bool IsOnline);

/// <summary>
/// AI 生成投票建议请求。
/// </summary>
/// <param name="Content">纸飞机正文内容。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="LocationTag">地点标签。</param>
/// <param name="OptionCount">希望生成的选项数量。</param>
public record GenerateVoteSuggestionRequest(
    string Content,
    string Mood,
    string LocationTag,
    int OptionCount = 3);

/// <summary>
/// AI 投票建议响应。
/// </summary>
/// <param name="RequestId">本次生成请求 ID。</param>
/// <param name="Title">生成的投票标题。</param>
/// <param name="Options">生成的投票选项。</param>
/// <param name="Source">结果来源，例如 ai 或 fallback。</param>
/// <param name="SourceDetail">来源补充说明。</param>
public record VoteSuggestionResponse(
    Guid RequestId,
    string Title,
    List<string> Options,
    string Source,
    string? SourceDetail = null);

/// <summary>
/// AI 投票配置响应。
/// </summary>
/// <param name="IsEnabled">是否启用 AI 投票建议。</param>
/// <param name="BaseUrl">AI 服务基础地址。</param>
/// <param name="Model">使用的模型名称。</param>
/// <param name="Temperature">采样温度。</param>
/// <param name="MaxTokens">最大输出令牌数。</param>
/// <param name="DefaultOptionCount">默认选项数量。</param>
/// <param name="TimeoutSeconds">请求超时时间，单位秒。</param>
/// <param name="EnableFallback">失败时是否允许回退到兜底策略。</param>
/// <param name="PerUserMinuteLimit">每个用户每分钟限制次数。</param>
/// <param name="SystemPrompt">系统提示词。</param>
/// <param name="HasApiKey">是否已配置 API Key。</param>
/// <param name="ApiKeyMasked">脱敏后的 API Key。</param>
/// <param name="UpdateTime">最近更新时间。</param>
/// <param name="UpdatedBy">最近更新人。</param>
public record AiVoteConfigResponse(
    bool IsEnabled,
    string BaseUrl,
    string Model,
    decimal Temperature,
    int MaxTokens,
    int DefaultOptionCount,
    int TimeoutSeconds,
    bool EnableFallback,
    int PerUserMinuteLimit,
    string SystemPrompt,
    bool HasApiKey,
    string ApiKeyMasked,
    DateTime UpdateTime,
    string? UpdatedBy);

/// <summary>
/// 更新 AI 投票配置请求。
/// </summary>
/// <param name="IsEnabled">是否启用 AI 投票建议。</param>
/// <param name="BaseUrl">AI 服务基础地址。</param>
/// <param name="Model">使用的模型名称。</param>
/// <param name="Temperature">采样温度。</param>
/// <param name="MaxTokens">最大输出令牌数。</param>
/// <param name="DefaultOptionCount">默认选项数量。</param>
/// <param name="TimeoutSeconds">请求超时时间，单位秒。</param>
/// <param name="EnableFallback">失败时是否允许兜底。</param>
/// <param name="PerUserMinuteLimit">每用户每分钟调用上限。</param>
/// <param name="SystemPrompt">系统提示词模板。</param>
/// <param name="ApiKey">新的 API Key，留空表示不修改。</param>
/// <param name="ClearApiKey">是否清空现有 API Key。</param>
public record UpdateAiVoteConfigRequest(
    bool IsEnabled,
    string BaseUrl,
    string Model,
    decimal Temperature,
    int MaxTokens,
    int DefaultOptionCount,
    int TimeoutSeconds,
    bool EnableFallback,
    int PerUserMinuteLimit,
    string SystemPrompt,
    string? ApiKey = null,
    bool ClearApiKey = false);

/// <summary>
/// AI 投票日志查询参数。
/// </summary>
/// <param name="Keyword">关键字搜索条件。</param>
/// <param name="Status">状态筛选值。</param>
/// <param name="Source">结果来源筛选值。</param>
/// <param name="Page">页码，从 1 开始。</param>
/// <param name="PageSize">每页条数。</param>
public record AiVoteLogQuery(
    string? Keyword = null,
    string? Status = null,
    string? Source = null,
    int Page = 1,
    int PageSize = 20);

/// <summary>
/// AI 投票日志项响应。
/// </summary>
/// <param name="Id">日志自增 ID。</param>
/// <param name="RequestId">请求 ID。</param>
/// <param name="AppUserId">用户 ID。</param>
/// <param name="ContentPreview">内容预览。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="LocationTag">地点标签。</param>
/// <param name="RequestedOptionCount">请求的选项数量。</param>
/// <param name="GeneratedTitle">生成的标题。</param>
/// <param name="GeneratedOptions">生成的选项列表。</param>
/// <param name="Source">结果来源。</param>
/// <param name="Status">执行状态。</param>
/// <param name="ErrorMessage">错误信息。</param>
/// <param name="DurationMs">耗时，单位毫秒。</param>
/// <param name="CreateTime">创建时间。</param>
public record AiVoteLogItemResponse(
    long Id,
    Guid RequestId,
    Guid? AppUserId,
    string ContentPreview,
    string Mood,
    string LocationTag,
    int RequestedOptionCount,
    string? GeneratedTitle,
    List<string> GeneratedOptions,
    string Source,
    string Status,
    string? ErrorMessage,
    int DurationMs,
    DateTime CreateTime);

/// <summary>
/// 纸飞机态度选项统计。
/// </summary>
/// <param name="OptionKey">态度选项标识。</param>
/// <param name="Count">该选项票数。</param>
public record PlaneAttitudeOptionResponse(string OptionKey, int Count);

/// <summary>
/// 纸飞机态度投票结果。
/// </summary>
/// <param name="Options">各选项统计结果。</param>
/// <param name="MyChoice">当前投票人的已选项。</param>
/// <param name="TotalCount">总投票数。</param>
public record PlaneAttitudeResponse(List<PlaneAttitudeOptionResponse> Options, string? MyChoice, int TotalCount);

/// <summary>
/// 地点响应。
/// </summary>
/// <param name="Id">地点 ID。</param>
/// <param name="Name">地点名称。</param>
/// <param name="SortOrder">排序值。</param>
/// <param name="PlaneCount">关联纸飞机数量。</param>
/// <param name="IconUrl">地点图标地址。</param>
public record LocationResponse(int Id, string Name, int SortOrder, int PlaneCount, string? IconUrl);

/// <summary>
/// 新增地点请求。
/// </summary>
/// <param name="Name">地点名称。</param>
/// <param name="SortOrder">排序值。</param>
/// <param name="IconUrl">地点图标地址。</param>
public record CreateLocationRequest(string Name, int SortOrder = 0, string? IconUrl = null);

/// <summary>
/// 更新地点请求。
/// </summary>
/// <param name="Name">地点名称。</param>
/// <param name="SortOrder">排序值。</param>
/// <param name="IconUrl">地点图标地址。</param>
public record UpdateLocationRequest(string Name, int SortOrder, string? IconUrl);

/// <summary>
/// 批量查询我的纸飞机请求。
/// </summary>
/// <param name="Ids">纸飞机 ID 列表。</param>
public record MyPlanesRequest(List<Guid> Ids);

/// <summary>
/// 后台统计响应。
/// </summary>
/// <param name="TotalPlanes">纸飞机总数。</param>
/// <param name="ActivePlanes">活跃纸飞机数量。</param>
/// <param name="TodayThrows">今日投递数。</param>
/// <param name="TotalLocations">地点总数。</param>
/// <param name="TotalComments">评论总数。</param>
/// <param name="ActiveMoodDistribution">当前飞行中纸飞机的心情分布。</param>
public record StatsResponse(
    int TotalPlanes,
    int ActivePlanes,
    int TodayThrows,
    int TotalLocations,
    int TotalComments,
    List<MoodStatItemResponse> ActiveMoodDistribution);

/// <summary>
/// 心情统计项。
/// </summary>
/// <param name="Mood">心情标识或文案。</param>
/// <param name="Count">数量。</param>
public record MoodStatItemResponse(string Mood, int Count);

/// <summary>
/// 首页文案响应。
/// </summary>
/// <param name="Phrases">首页展示文案列表。</param>
public record HomeHeadlineResponse(List<string> Phrases);

/// <summary>
/// 更新首页文案请求。
/// </summary>
/// <param name="Phrases">新的首页文案列表。</param>
public record UpdateHomeHeadlinesRequest(List<string> Phrases);

/// <summary>
/// 情绪配置项响应。
/// </summary>
/// <param name="Key">情绪唯一标识。</param>
/// <param name="Label">情绪显示名称。</param>
/// <param name="IconUrl">情绪图标地址。</param>
/// <param name="Color">情绪颜色值。</param>
/// <param name="SortOrder">排序值。</param>
/// <param name="IsActive">是否启用。</param>
/// <param name="IsCustom">是否为自定义项。</param>
public record MoodConfigItemResponse(
    string Key,
    string Label,
    string IconUrl,
    string Color,
    int SortOrder,
    bool IsActive,
    bool IsCustom);

/// <summary>
/// 更新情绪配置项请求。
/// </summary>
/// <param name="Key">情绪唯一标识。</param>
/// <param name="Label">显示名称。</param>
/// <param name="IconUrl">图标地址。</param>
/// <param name="Color">颜色值。</param>
/// <param name="SortOrder">排序值。</param>
/// <param name="IsActive">是否启用。</param>
/// <param name="IsCustom">是否为自定义项。</param>
public record UpdateMoodConfigItemRequest(
    string Key,
    string Label,
    string IconUrl,
    string? Color = null,
    int SortOrder = 0,
    bool IsActive = true,
    bool IsCustom = false);

/// <summary>
/// 批量更新情绪配置请求。
/// </summary>
/// <param name="Items">情绪配置项列表。</param>
public record UpdateMoodConfigsRequest(List<UpdateMoodConfigItemRequest> Items);

/// <summary>
/// 存活时间配置响应。
/// </summary>
/// <param name="Hours">时长，单位小时。</param>
/// <param name="Label">显示名称。</param>
/// <param name="SortOrder">排序值。</param>
/// <param name="IsActive">是否启用。</param>
public record ExpireOptionResponse(
    int Hours,
    string Label,
    int SortOrder,
    bool IsActive);

/// <summary>
/// 更新存活时间配置项请求。
/// </summary>
/// <param name="Hours">时长，单位小时。</param>
/// <param name="Label">显示名称。</param>
/// <param name="SortOrder">排序值。</param>
/// <param name="IsActive">是否启用。</param>
public record UpdateExpireOptionItemRequest(
    int Hours,
    string Label,
    int SortOrder = 0,
    bool IsActive = true);

/// <summary>
/// 批量更新存活时间配置请求。
/// </summary>
/// <param name="Items">配置项列表。</param>
public record UpdateExpireOptionsRequest(List<UpdateExpireOptionItemRequest> Items);

/// <summary>
/// 敏感词配置项响应。
/// </summary>
/// <param name="Id">敏感词主键。</param>
/// <param name="Word">原始敏感词内容。</param>
/// <param name="Category">分类编码。</param>
/// <param name="MatchMode">匹配方式。</param>
/// <param name="HandleMode">处理方式。</param>
/// <param name="ReplaceText">替换文本。</param>
/// <param name="Scope">生效范围，多个范围逗号分隔。</param>
/// <param name="Severity">严重级别。</param>
/// <param name="Priority">优先级。</param>
/// <param name="IsEnabled">是否启用。</param>
/// <param name="Remark">备注说明。</param>
public record SensitiveWordConfigResponse(
    Guid Id,
    string Word,
    string Category,
    string MatchMode,
    string HandleMode,
    string? ReplaceText,
    string Scope,
    int Severity,
    int Priority,
    bool IsEnabled,
    string? Remark);

/// <summary>
/// AI 检出的待采纳敏感词响应。
/// </summary>
/// <param name="Id">待采纳记录 ID。</param>
/// <param name="SuggestedWord">AI 建议敏感词。</param>
/// <param name="Category">分类编码。</param>
/// <param name="MatchMode">匹配方式。</param>
/// <param name="HandleMode">处理方式。</param>
/// <param name="ReplaceText">替换文本。</param>
/// <param name="Scope">生效范围。</param>
/// <param name="Severity">严重级别。</param>
/// <param name="Priority">优先级。</param>
/// <param name="Remark">备注。</param>
/// <param name="SourceTextPreview">命中内容预览。</param>
/// <param name="Reason">AI 理由。</param>
/// <param name="Confidence">AI 置信度。</param>
/// <param name="CreateTime">创建时间。</param>
public record AiSensitiveWordSuggestionResponse(
    int Id,
    string SuggestedWord,
    string Category,
    string MatchMode,
    string HandleMode,
    string? ReplaceText,
    string Scope,
    int Severity,
    int Priority,
    string? Remark,
    string SourceTextPreview,
    string? Reason,
    decimal? Confidence,
    DateTime CreateTime);

/// <summary>
/// 更新敏感词配置项请求。
/// </summary>
/// <param name="Id">敏感词主键，空值表示新增。</param>
/// <param name="Word">原始敏感词内容。</param>
/// <param name="Category">分类编码。</param>
/// <param name="MatchMode">匹配方式。</param>
/// <param name="HandleMode">处理方式。</param>
/// <param name="ReplaceText">替换文本。</param>
/// <param name="Scope">生效范围，多个范围逗号分隔。</param>
/// <param name="Severity">严重级别。</param>
/// <param name="Priority">优先级。</param>
/// <param name="IsEnabled">是否启用。</param>
/// <param name="Remark">备注说明。</param>
public record UpdateSensitiveWordConfigItemRequest(
    Guid? Id,
    string Word,
    string Category,
    string MatchMode,
    string HandleMode,
    string? ReplaceText,
    string Scope,
    int Severity = 3,
    int Priority = 100,
    bool IsEnabled = true,
    string? Remark = null);

/// <summary>
/// 批量更新敏感词配置请求。
/// </summary>
/// <param name="Items">敏感词配置项列表。</param>
public record UpdateSensitiveWordsRequest(List<UpdateSensitiveWordConfigItemRequest> Items);

/// <summary>
/// 前台敏感词规则响应。
/// </summary>
/// <param name="Word">敏感词内容。</param>
/// <param name="MatchMode">匹配方式。</param>
/// <param name="Scope">生效范围。</param>
public record SensitiveWordPublicResponse(
    string Word,
    string MatchMode,
    string Scope);

/// <summary>
/// 管理员登录请求。
/// </summary>
/// <param name="UserName">管理员用户名。</param>
/// <param name="Password">管理员密码。</param>
public record LoginRequest(string UserName, string Password);

/// <summary>
/// 登录令牌响应。
/// </summary>
/// <param name="Token">访问令牌。</param>
/// <param name="RefreshToken">刷新令牌。</param>
public record LoginTokenResponse(string Token, string RefreshToken);

/// <summary>
/// 刷新令牌请求。
/// </summary>
/// <param name="RefreshToken">刷新令牌字符串。</param>
public record RefreshTokenRequest(string RefreshToken);

/// <summary>
/// 管理员用户信息响应。
/// </summary>
/// <param name="UserId">用户 ID。</param>
/// <param name="UserName">显示用户名。</param>
/// <param name="Roles">角色编码列表。</param>
/// <param name="Buttons">按钮权限标识列表。</param>
public record UserInfoResponse(string UserId, string UserName, List<string> Roles, List<string> Buttons);

/// <summary>
/// 用户注册请求。
/// </summary>
/// <param name="Username">用户名。</param>
/// <param name="StudentId">学号。</param>
/// <param name="Phone">手机号。</param>
/// <param name="Password">登录密码。</param>
/// <param name="CaptchaId">验证码 ID。</param>
/// <param name="CaptchaCode">验证码内容。</param>
public record RegisterUserRequest(string Username, string StudentId, string Phone, string Password, string CaptchaId, string CaptchaCode);

/// <summary>
/// 用户注册成功响应。
/// </summary>
/// <param name="UserId">用户 ID。</param>
/// <param name="Username">用户名。</param>
/// <param name="Phone">手机号。</param>
/// <param name="StudentId">学号。</param>
public record RegisterUserResponse(Guid UserId, string Username, string Phone, string StudentId);

/// <summary>
/// 用户登录请求。
/// </summary>
/// <param name="Credential">登录凭据，可为学号或手机号。</param>
/// <param name="Password">登录密码。</param>
/// <param name="CaptchaId">验证码 ID。</param>
/// <param name="CaptchaCode">验证码内容。</param>
public record UserLoginRequest(string Credential, string Password, string CaptchaId, string CaptchaCode);

/// <summary>
/// 用户刷新令牌请求。
/// </summary>
/// <param name="RefreshToken">刷新令牌字符串。</param>
public record RefreshUserTokenRequest(string RefreshToken);

/// <summary>
/// 用户退出登录请求。
/// </summary>
/// <param name="RefreshToken">需要注销的刷新令牌，留空表示注销当前用户全部有效令牌。</param>
public record LogoutUserRequest(string? RefreshToken);

/// <summary>
/// 图形验证码响应。
/// </summary>
/// <param name="CaptchaId">验证码 ID。</param>
/// <param name="CaptchaImage">验证码图片，通常为 Base64 数据。</param>
/// <param name="ExpiresIn">过期秒数。</param>
public record CaptchaResponse(string CaptchaId, string CaptchaImage, int ExpiresIn);

/// <summary>
/// 当前用户基本信息响应。
/// </summary>
/// <param name="UserId">用户 ID。</param>
/// <param name="Username">用户名。</param>
/// <param name="AvatarUrl">头像地址。</param>
/// <param name="Gender">性别标识。</param>
/// <param name="Bio">个人简介。</param>
public record AppUserInfoResponse(Guid UserId, string Username, string? AvatarUrl, string Gender, string Bio);

/// <summary>
/// 用户登录成功响应。
/// </summary>
/// <param name="AccessToken">访问令牌。</param>
/// <param name="RefreshToken">刷新令牌。</param>
/// <param name="ExpiresIn">访问令牌过期秒数。</param>
/// <param name="User">当前登录用户信息。</param>
public record UserLoginResponse(string AccessToken, string RefreshToken, int ExpiresIn, AppUserInfoResponse User);

/// <summary>
/// 用户资料响应。
/// </summary>
/// <param name="Username">用户名。</param>
/// <param name="AvatarUrl">头像地址。</param>
/// <param name="Gender">性别标识。</param>
/// <param name="Bio">个人简介。</param>
public record UserProfileResponse(string Username, string? AvatarUrl, string Gender, string Bio);

/// <summary>
/// 更新用户资料请求。
/// </summary>
/// <param name="Username">用户名。</param>
/// <param name="AvatarUrl">头像地址。</param>
/// <param name="Gender">性别标识。</param>
/// <param name="Bio">个人简介。</param>
public record UpdateUserProfileRequest(string Username, string? AvatarUrl, string Gender, string Bio);

/// <summary>
/// 上传头像响应。
/// </summary>
/// <param name="Url">头像访问地址。</param>
public record UploadAvatarResponse(string Url);

/// <summary>
/// 我的投递记录查询条件。
/// </summary>
/// <param name="Status">状态筛选值。</param>
/// <param name="Keyword">关键字搜索。</param>
/// <param name="Page">页码，从 1 开始。</param>
/// <param name="PageSize">每页条数。</param>
public record MinePlaneQuery(string? Status = null, string? Keyword = null, int Page = 1, int PageSize = 20);

/// <summary>
/// 我的历史记录查询条件。
/// </summary>
/// <param name="Keyword">关键字搜索。</param>
/// <param name="Page">页码，从 1 开始。</param>
/// <param name="PageSize">每页条数。</param>
public record MineHistoryQuery(string? Keyword = null, int Page = 1, int PageSize = 20);

/// <summary>
/// 我的纸飞机列表项。
/// </summary>
/// <param name="Id">纸飞机 ID。</param>
/// <param name="LocationTag">地点标签。</param>
/// <param name="Content">正文内容。</param>
/// <param name="Mood">情绪标识。</param>
/// <param name="CreateTime">创建时间。</param>
/// <param name="ExpireTime">过期时间。</param>
/// <param name="PickCount">被捞起次数。</param>
/// <param name="LikeCount">点赞次数。</param>
/// <param name="CommentCount">评论数。</param>
/// <param name="Status">状态文本。</param>
/// <param name="IsRecalled">是否已撤回。</param>
/// <param name="FueledAt">被点燃时间。</param>
/// <param name="PickedAt">被捞起时间。</param>
public record MinePlaneItemResponse(
    Guid Id,
    string LocationTag,
    string Content,
    string Mood,
    DateTime CreateTime,
    DateTime ExpireTime,
    int PickCount,
    int LikeCount,
    int CommentCount,
    string Status,
    bool IsRecalled,
    DateTime? FueledAt = null,
    DateTime? PickedAt = null);

/// <summary>
/// 我的纸飞机分页响应。
/// </summary>
/// <param name="Items">列表数据。</param>
/// <param name="Total">总数。</param>
public record MinePlaneListResponse(List<MinePlaneItemResponse> Items, int Total);

/// <summary>
/// 通用分页响应。
/// </summary>
/// <typeparam name="T">列表项类型。</typeparam>
/// <param name="Items">当前页数据。</param>
/// <param name="Total">总记录数。</param>
public record PagedResponse<T>(List<T> Items, int Total);

/// <summary>
/// 管理端评论查询条件。
/// </summary>
/// <param name="Keyword">关键字搜索。</param>
/// <param name="PlaneId">纸飞机 ID 筛选。</param>
/// <param name="Location">地点筛选值。</param>
/// <param name="CommentType">评论类型筛选值。</param>
/// <param name="HasReplies">是否有回复。</param>
/// <param name="CreateTimeStart">评论开始时间。</param>
/// <param name="CreateTimeEnd">评论结束时间。</param>
/// <param name="Page">页码，从 1 开始。</param>
/// <param name="PageSize">每页条数。</param>
public record AdminCommentQuery(
    string? Keyword = null,
    Guid? PlaneId = null,
    string? Location = null,
    string? CommentType = null,
    bool? HasReplies = null,
    DateTime? CreateTimeStart = null,
    DateTime? CreateTimeEnd = null,
    int Page = 1,
    int PageSize = 20);

/// <summary>
/// 管理端评论列表项。
/// </summary>
/// <param name="Id">评论 ID。</param>
/// <param name="PlaneId">所属纸飞机 ID。</param>
/// <param name="LocationTag">地点标签。</param>
/// <param name="PlaneContent">纸飞机正文预览。</param>
/// <param name="Reply">评论内容。</param>
/// <param name="NickName">评论昵称。</param>
/// <param name="CreateTime">评论时间。</param>
/// <param name="ParentCommentId">父评论 ID。</param>
/// <param name="ReplyToNickName">被回复昵称。</param>
/// <param name="ReplyCount">回复数量。</param>
public record AdminCommentItemResponse(
    Guid Id,
    Guid PlaneId,
    string LocationTag,
    string PlaneContent,
    string Reply,
    string NickName,
    DateTime CreateTime,
    Guid? ParentCommentId,
    string? ReplyToNickName,
    int ReplyCount);

/// <summary>
/// 管理端用户查询条件。
/// </summary>
/// <param name="Keyword">关键字搜索。</param>
/// <param name="IsActive">启用状态筛选。</param>
/// <param name="Page">页码，从 1 开始。</param>
/// <param name="PageSize">每页条数。</param>
public record AdminUserQuery(string? Keyword = null, bool? IsActive = null, int Page = 1, int PageSize = 20);

/// <summary>
/// 管理端用户列表项。
/// </summary>
/// <param name="Id">用户 ID。</param>
/// <param name="Username">用户名。</param>
/// <param name="StudentId">学号。</param>
/// <param name="Phone">手机号。</param>
/// <param name="AvatarUrl">头像地址。</param>
/// <param name="Gender">性别标识。</param>
/// <param name="Bio">个人简介。</param>
/// <param name="IsActive">是否启用。</param>
/// <param name="CreateTime">注册时间。</param>
/// <param name="LastLoginTime">最后登录时间。</param>
/// <param name="ThrownPlaneCount">投递纸飞机数量。</param>
/// <param name="LikeCount">收到点赞数。</param>
/// <param name="PickCount">纸飞机被捞起数。</param>
public record AdminUserItemResponse(
    Guid Id,
    string Username,
    string StudentId,
    string Phone,
    string? AvatarUrl,
    string Gender,
    string Bio,
    bool IsActive,
    DateTime CreateTime,
    DateTime? LastLoginTime,
    int ThrownPlaneCount,
    int LikeCount,
    int PickCount);

/// <summary>
/// 更新应用用户状态请求。
/// </summary>
/// <param name="IsActive">是否启用该用户。</param>
public record UpdateAppUserStatusRequest(bool IsActive);

/// <summary>
/// 管理端纸飞机查询条件。
/// </summary>
/// <param name="Id">纸飞机 ID 或短号筛选值。</param>
/// <param name="Keyword">关键字搜索。</param>
/// <param name="Location">地点筛选值。</param>
/// <param name="Mood">情绪筛选值。</param>
/// <param name="CreateTimeStart">创建开始时间。</param>
/// <param name="CreateTimeEnd">创建结束时间。</param>
public record AdminPlaneQuery(
    string? Id = null,
    string? Keyword = null,
    string? Location = null,
    string? Mood = null,
    DateTime? CreateTimeStart = null,
    DateTime? CreateTimeEnd = null);
