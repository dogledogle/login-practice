# AGENTS.md

## 项目概览

这是一个用于练习常见登录流程的 TypeScript monorepo 项目。

- 前端：`apps/web`，React + Vite
- 后端：`apps/api`，Node + Express
- 共享类型与校验 schema：`packages/shared`
- 数据库：SQLite + Prisma

当前已经支持：

- 邮箱密码注册与登录
- Mock 短信验证码登录
- 手机扫码确认登录
- Cookie Session 模式
- JWT Bearer Token 模式

## 项目结构

```text
apps/
  api/
    prisma/schema.prisma
    src/
      app.ts
      server.ts
      routes/auth.ts
      auth-middleware.ts
      security.ts
  web/
    src/
      App.tsx
      api.ts
      styles.css
packages/
  shared/
    src/index.ts
```

## 常用命令

所有命令默认从项目根目录执行：`D:\Code\login-practice`。

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

验证命令：

```bash
npm run build
npm run test
npx tsc --noEmit -p apps/web/tsconfig.json
```

只运行 API 测试：

```bash
npm run test -w @login-practice/api
```

只运行前端类型检查：

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

## 环境变量

API 环境变量文件位于 `apps/api/.env`。

关键配置：

```env
DATABASE_URL="file:./dev.db"
API_PORT=4000
WEB_ORIGIN=http://localhost:5173
APP_BASE_URL=http://localhost:5173
SESSION_SECRET=local-session-secret
JWT_SECRET=local-jwt-secret
COOKIE_NAME=login_practice_sid
SMS_CODE_TTL_SECONDS=300
QR_TTL_SECONDS=120
```

如果要用真实手机扫码登录，需要把 `WEB_ORIGIN` 和 `APP_BASE_URL` 改成电脑的局域网地址，例如：

```env
WEB_ORIGIN=http://192.168.1.23:5173
APP_BASE_URL=http://192.168.1.23:5173
```

手机和电脑必须在同一个网络下，并且防火墙需要允许访问 `5173` 和 `4000` 端口。

## 开发约定

- 请求体、响应体、枚举和共享类型优先放在 `packages/shared/src/index.ts`。
- 前后端都应复用 `packages/shared` 中的 TypeScript 类型和 Zod schema。
- 后端认证接口逻辑集中在 `apps/api/src/routes/auth.ts`。
- 前端 API 请求封装集中在 `apps/web/src/api.ts`。
- 前端页面路由和主要 UI 状态集中在 `apps/web/src/App.tsx`。
- 样式目前集中维护在 `apps/web/src/styles.css`。
- 修改时优先做小范围、聚焦的改动，避免无关重构。
- 不要提交生成的 SQLite 数据库文件。

## 登录流程说明

账号密码登录：

- `POST /auth/register`
- `POST /auth/login/password`
- `GET /auth/me`
- `POST /auth/logout`

短信验证码登录：

- `POST /auth/login/sms/request-code`
- `POST /auth/login/sms/verify`
- 开发环境会返回 `devCode`，方便本地练习，不接真实短信平台。

扫码登录：

- 电脑端通过 `POST /auth/qr/challenges` 创建扫码 challenge。
- 电脑端把后端返回的 `confirmUrl` 渲染为二维码。
- 手机扫码后打开 `/qr/confirm/:id`。
- 手机端先标记已扫码，然后确认或拒绝登录。
- 电脑端持续轮询 `GET /auth/qr/challenges/:id`，直到状态变为 confirmed、rejected 或 expired。

扫码状态流转：

```text
pending -> scanned -> confirmed
pending -> scanned -> rejected
pending -> expired
```

## 测试要求

修改后端认证逻辑时：

- 添加或更新 `apps/api/src/routes/auth.test.ts` 中的测试。
- 如果改动影响会话机制，需要同时覆盖 Cookie 和 JWT 行为。
- 需要覆盖错误凭证、验证码过期、验证码已使用、二维码过期等失败场景。

修改前端登录 UI 时：

- 运行前端 TypeScript 检查。
- 在浏览器中手动验证受影响流程。
- 修改扫码确认页或响应式样式时，需要检查手机视口布局。

## 本地注意事项

- 在受限沙箱中，Vite/esbuild 可能因为 `spawn EPERM` 失败；这通常是环境限制，不一定是源码错误。
- 如果缺少依赖，请在项目根目录运行 `npm install`，不要分别进入子目录安装。
- 重新安装依赖后，需要先运行 `npm run db:generate` 生成 Prisma Client，再启动 API。
