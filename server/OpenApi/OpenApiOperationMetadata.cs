using System.Reflection;

namespace server.OpenApi;

internal sealed record OpenApiOperationItem(
    string Summary,
    string? Description = null,
    IReadOnlyDictionary<string, string>? Parameters = null);

internal static class OpenApiOperationMetadata
{
    private static readonly Dictionary<string, OpenApiOperationItem> Operations = new(StringComparer.Ordinal)
    {
        ["AuthController.Login"] = new("管理员登录", "使用管理员用户名和密码换取访问令牌与刷新令牌。"),
        ["AuthController.GetUserInfo"] = new("获取当前管理员信息", "返回当前登录管理员的基础资料与角色信息。"),
        ["AuthController.RefreshToken"] = new("刷新管理员令牌", "使用管理员刷新令牌换取新的访问令牌。"),
        ["AuthController.Error"] = new("统一错误回显", "回显错误码与错误信息，便于前端调试。", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["code"] = "错误码。",
            ["msg"] = "错误描述。"
        }),

        ["UserAuthController.GetCaptcha"] = new("获取图形验证码", "返回注册或登录所需的图形验证码。"),
        ["UserAuthController.Register"] = new("用户注册", "使用用户名、学号、手机号和验证码创建新用户。"),
        ["UserAuthController.Login"] = new("用户登录", "使用学号或手机号登录并获取用户令牌。"),
        ["UserAuthController.RefreshToken"] = new("刷新用户令牌", "使用用户刷新令牌换取新的访问令牌。"),
        ["UserAuthController.Me"] = new("获取当前登录用户", "返回当前登录用户的基础信息。"),
        ["UserAuthController.Logout"] = new("用户退出登录", "注销当前用户指定刷新令牌或全部有效刷新令牌。"),

        ["UserProfileController.GetProfile"] = new("获取当前用户资料"),
        ["UserProfileController.UpdateProfile"] = new("更新当前用户资料"),
        ["UserProfileController.UploadAvatar"] = new("上传用户头像", "上传用户头像并返回可访问地址。"),

        ["HomeController.GetHeadlines"] = new("获取首页文案"),
        ["AdminHomeController.GetHeadlines"] = new("获取首页文案配置"),
        ["AdminHomeController.UpdateHeadlines"] = new("更新首页文案配置"),

        ["MoodsController.GetAll"] = new("获取启用中的情绪配置"),
        ["AdminMoodsController.GetAll"] = new("获取全部情绪配置"),
        ["AdminMoodsController.Update"] = new("更新情绪配置"),

        ["ExpireOptionsController.GetAll"] = new("获取启用中的存活时间配置"),
        ["AdminExpireOptionsController.GetAll"] = new("获取全部存活时间配置"),
        ["AdminExpireOptionsController.Update"] = new("更新存活时间配置"),

        ["LocationsController.GetAll"] = new("查询地点列表", "支持按关键字筛选地点。", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["keyword"] = "地点关键字，用于模糊搜索。"
        }),
        ["LocationsController.Create"] = new("新增地点"),
        ["LocationsController.Update"] = new("更新地点"),
        ["LocationsController.Delete"] = new("删除地点"),

        ["UploadsController.UploadImage"] = new("上传纸飞机图片"),
        ["UploadsController.UploadLocationIcon"] = new("上传地点图标"),
        ["UploadsController.UploadMoodIcon"] = new("上传情绪图标"),

        ["CommentsController.GetComments"] = new("获取纸飞机评论列表"),
        ["CommentsController.AddComment"] = new("新增评论或回复"),

        ["StatsController.GetStats"] = new("获取后台统计数据"),

        ["AiController.GenerateVoteSuggestion"] = new("生成投票建议", "根据正文内容、情绪和地点自动生成投票标题与选项。"),
        ["AdminAiController.GetConfig"] = new("获取 AI 投票配置"),
        ["AdminAiController.UpdateConfig"] = new("更新 AI 投票配置"),
        ["AdminAiController.GetLogs"] = new("查询 AI 投票日志"),

        ["AdminCommentsController.GetComments"] = new("分页查询评论"),
        ["AdminCommentsController.DeleteComment"] = new("删除评论"),

        ["AdminUsersController.GetUsers"] = new("分页查询用户"),
        ["AdminUsersController.UpdateStatus"] = new("更新用户启用状态"),

        ["PlanesController.Throw"] = new("投递纸飞机", "创建一条新的纸飞机内容，可附带图片和投票。"),
        ["PlanesController.GetByLocation"] = new("按地点查询纸飞机", "返回某个地点或全部地点下的有效纸飞机。", new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["location"] = "地点标签，为空时返回全部地点。"
        }),
        ["PlanesController.GetById"] = new("按 ID 获取纸飞机"),
        ["PlanesController.GetByCode"] = new("按短号获取纸飞机", null, new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["code"] = "纸飞机短号。"
        }),
        ["PlanesController.GetQrCodePng"] = new("获取纸飞机 PNG 二维码"),
        ["PlanesController.GetQrCodeSvg"] = new("获取纸飞机 SVG 二维码"),
        ["PlanesController.GetRandom"] = new("随机获取一架纸飞机"),
        ["PlanesController.GetRandomCandidates"] = new("获取随机候选池"),
        ["PlanesController.GetTrending"] = new("获取热门纸飞机"),
        ["PlanesController.GetMyPlanes"] = new("按 ID 批量获取我的纸飞机"),
        ["PlanesController.GetMyThrownPlanes"] = new("获取我的投递记录"),
        ["PlanesController.GetMyFueledPlanes"] = new("获取我点燃过的纸飞机"),
        ["PlanesController.GetMyPickedPlanes"] = new("获取我捞起过的纸飞机"),
        ["PlanesController.GetAllAdmin"] = new("管理端查询纸飞机"),
        ["PlanesController.GetReported"] = new("获取被举报纸飞机"),
        ["PlanesController.UpdateOnlineStatus"] = new("更新纸飞机上下线状态"),
        ["PlanesController.Update"] = new("更新纸飞机"),
        ["PlanesController.UpdateByAdminRoute"] = new("管理端路由更新纸飞机"),
        ["PlanesController.Like"] = new("点赞纸飞机"),
        ["PlanesController.Report"] = new("举报纸飞机"),
        ["PlanesController.Recall"] = new("撤回我投递的纸飞机"),
        ["PlanesController.Destroy"] = new("销毁纸飞机"),
        ["PlanesController.GetAttitudes"] = new("获取纸飞机态度投票结果", null, new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["voterKey"] = "投票人标识，用于返回当前投票人的已选项。"
        }),
        ["PlanesController.VoteAttitude"] = new("提交纸飞机态度投票"),
        ["PlanesController.Delete"] = new("删除纸飞机"),
    };

    private static readonly Dictionary<string, string> Tags = new(StringComparer.Ordinal)
    {
        ["AuthController"] = "管理端认证",
        ["UserAuthController"] = "用户端认证",
        ["UserProfileController"] = "用户资料",
        ["HomeController"] = "首页展示",
        ["AdminHomeController"] = "管理端首页",
        ["MoodsController"] = "情绪配置",
        ["AdminMoodsController"] = "管理端情绪",
        ["ExpireOptionsController"] = "存活时间",
        ["AdminExpireOptionsController"] = "管理端存活时间",
        ["LocationsController"] = "地点管理",
        ["UploadsController"] = "文件上传",
        ["CommentsController"] = "评论",
        ["StatsController"] = "后台统计",
        ["AiController"] = "AI 辅助",
        ["AdminAiController"] = "管理端 AI",
        ["AdminCommentsController"] = "管理端评论",
        ["AdminUsersController"] = "管理端用户",
        ["PlanesController"] = "纸飞机"
    };

    private static readonly Dictionary<string, string> GenericParameters = new(StringComparer.OrdinalIgnoreCase)
    {
        ["id"] = "目标资源 ID。",
        ["planeId"] = "纸飞机 ID。",
        ["keyword"] = "关键字，用于模糊搜索。",
        ["file"] = "待上传的文件。",
        ["query"] = "查询条件对象。",
        ["request"] = "请求体对象。"
    };

    public static string GetActionKey(MethodInfo method)
    {
        return $"{method.DeclaringType?.Name}.{method.Name}";
    }

    public static bool TryGetOperation(string actionKey, out OpenApiOperationItem item)
    {
        return Operations.TryGetValue(actionKey, out item!);
    }

    public static string? GetParameterDescription(MethodInfo? method, string? parameterName)
    {
        if (method is null || string.IsNullOrWhiteSpace(parameterName))
        {
            return null;
        }

        var actionKey = GetActionKey(method);
        return Operations.TryGetValue(actionKey, out var item) &&
               item.Parameters is not null &&
               item.Parameters.TryGetValue(parameterName, out var description)
            ? description
            : null;
    }

    public static string? GetGenericParameterDescription(string? parameterName)
    {
        return !string.IsNullOrWhiteSpace(parameterName) && GenericParameters.TryGetValue(parameterName, out var description)
            ? description
            : null;
    }

    public static string? GetTagName(string? controllerName)
    {
        return !string.IsNullOrWhiteSpace(controllerName) && Tags.TryGetValue(controllerName, out var tagName)
            ? tagName
            : controllerName;
    }
}
