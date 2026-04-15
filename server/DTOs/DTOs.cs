namespace server.DTOs;

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

public record RandomCandidateListResponse(
    DateTime CurrentUtcTime,
    int Total,
    List<RandomCandidateItemResponse> Items);

public record AddCommentRequest(string Reply, bool IsAnonymous = true, string? NickName = null, Guid? ParentCommentId = null);
public record CommentResponse(Guid Id, string Reply, string NickName, DateTime CreateTime, Guid? ParentCommentId = null, string? ReplyToNickName = null);
public record VotePlaneAttitudeRequest(string OptionKey, string VoterKey);
public record PlaneAttitudeOptionResponse(string OptionKey, int Count);
public record PlaneAttitudeResponse(List<PlaneAttitudeOptionResponse> Options, string? MyChoice, int TotalCount);
public record LocationResponse(int Id, string Name, int SortOrder, int PlaneCount, string? IconUrl);
public record CreateLocationRequest(string Name, int SortOrder = 0, string? IconUrl = null);
public record UpdateLocationRequest(string Name, int SortOrder, string? IconUrl);
public record MyPlanesRequest(List<Guid> Ids);
public record StatsResponse(int TotalPlanes, int ActivePlanes, int TodayThrows, int TotalLocations, int TotalComments);
public record HomeHeadlineResponse(List<string> Phrases);
public record UpdateHomeHeadlinesRequest(List<string> Phrases);
public record MoodConfigItemResponse(
    string Key,
    string Label,
    string IconUrl,
    string Color,
    int SortOrder,
    bool IsActive,
    bool IsCustom);
public record UpdateMoodConfigItemRequest(
    string Key,
    string Label,
    string IconUrl,
    string? Color = null,
    int SortOrder = 0,
    bool IsActive = true,
    bool IsCustom = false);
public record UpdateMoodConfigsRequest(List<UpdateMoodConfigItemRequest> Items);
public record ExpireOptionResponse(
    int Hours,
    string Label,
    int SortOrder,
    bool IsActive);
public record UpdateExpireOptionItemRequest(
    int Hours,
    string Label,
    int SortOrder = 0,
    bool IsActive = true);
public record UpdateExpireOptionsRequest(List<UpdateExpireOptionItemRequest> Items);

public record LoginRequest(string UserName, string Password);
public record LoginTokenResponse(string Token, string RefreshToken);
public record RefreshTokenRequest(string RefreshToken);
public record UserInfoResponse(string UserId, string UserName, List<string> Roles, List<string> Buttons);

public record RegisterUserRequest(string Username, string StudentId, string Phone, string Password, string CaptchaId, string CaptchaCode);
public record RegisterUserResponse(Guid UserId, string Username, string Phone, string StudentId);
public record UserLoginRequest(string Credential, string Password, string CaptchaId, string CaptchaCode);
public record RefreshUserTokenRequest(string RefreshToken);
public record LogoutUserRequest(string? RefreshToken);
public record CaptchaResponse(string CaptchaId, string CaptchaImage, int ExpiresIn);

public record AppUserInfoResponse(Guid UserId, string Username, string? AvatarUrl, string Gender, string Bio);
public record UserLoginResponse(string AccessToken, string RefreshToken, int ExpiresIn, AppUserInfoResponse User);

public record UserProfileResponse(string Username, string? AvatarUrl, string Gender, string Bio);
public record UpdateUserProfileRequest(string Username, string? AvatarUrl, string Gender, string Bio);
public record UploadAvatarResponse(string Url);

public record MinePlaneQuery(string? Status = null, string? Keyword = null, int Page = 1, int PageSize = 20);
public record MineHistoryQuery(string? Keyword = null, int Page = 1, int PageSize = 20);

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

public record MinePlaneListResponse(List<MinePlaneItemResponse> Items, int Total);

public record PagedResponse<T>(List<T> Items, int Total);

public record AdminCommentQuery(string? Keyword = null, Guid? PlaneId = null, int Page = 1, int PageSize = 20);

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

public record AdminUserQuery(string? Keyword = null, bool? IsActive = null, int Page = 1, int PageSize = 20);

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

public record UpdateAppUserStatusRequest(bool IsActive);

public record AdminPlaneQuery(
    string? Id = null,
    string? Keyword = null,
    string? Location = null,
    string? Mood = null,
    DateTime? CreateTimeStart = null,
    DateTime? CreateTimeEnd = null);
