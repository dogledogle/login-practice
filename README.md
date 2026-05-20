# Login Practice

一个用于练习常见登录模块的全栈 TypeScript 项目。

## 技术栈

- React + Vite + TypeScript
- Node + Express + TypeScript
- SQLite + Prisma
- Cookie Session 和 JWT Bearer Token

## 功能

- 账号密码注册、登录、退出
- Mock 短信验证码登录
- 真实手机扫码登录，支持局域网扫码确认
- 会话调试页，可切换 Cookie / JWT 模式

## 启动

```bash
npm install
npm run db:generate
npm run db:push
npm run dev
```

前端默认运行在 `http://localhost:5173`，API 默认运行在 `http://localhost:4000`。

如果要让手机扫码访问，请复制 `apps/api/.env.example` 为 `apps/api/.env`，把 `APP_BASE_URL` 改成电脑在局域网中的地址，例如：

```env
APP_BASE_URL=http://192.168.1.23:5173
WEB_ORIGIN=http://192.168.1.23:5173
```

同时确保电脑和手机在同一局域网，防火墙允许访问 5173 和 4000 端口。
