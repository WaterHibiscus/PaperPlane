# PaperPlane 后端接口文档

## 访问地址

- Swagger UI: `http://localhost:5000/docs`
- OpenAPI JSON: `http://localhost:5000/docs/v1/openapi.json`
- 局域网访问: `http://你的局域网IP:5000/docs`

如果你启动时指定了其他端口，把上面的 `5000` 替换成实际端口即可。
项目默认监听 `0.0.0.0:5000`，直接执行 `dotnet run` 即可被局域网访问。

## 鉴权方式

项目接口使用 JWT Bearer Token。

### 管理端登录

- 接口: `POST /auth/login`
- 成功后返回 `accessToken` 和 `refreshToken`

### 用户端登录

- 接口: `POST /api/user-auth/login`
- 成功后返回 `accessToken` 和 `refreshToken`

### 在 Swagger 中调试受保护接口

1. 先调用登录接口拿到 `accessToken`
2. 点击 Swagger 页面右上角 `Authorize`
3. 输入 `Bearer {accessToken}`
4. 再调用需要鉴权的接口

## 主要接口分组

- `auth`: 管理端认证
- `api/user-auth`: 用户端认证
- `api/users/me`: 当前用户资料
- `api/planes`: 纸飞机主业务
- `api/planes/{planeId}/comments`: 评论
- `api/uploads`: 上传
- `api/home`: 首页
- `api/moods`: 心情
- `api/locations`: 地点
- `api/expire-options`: 存活时间配置
- `api/stats`: 管理端统计
- `api/admin/*`: 管理后台接口
- `api/ai` 与 `api/admin/ai/*`: AI 相关接口

## 启动命令

```powershell
cd D:\web课程\PaperPlane\server
dotnet run
```

启动后直接访问 `/docs` 即可查看和调试接口。
