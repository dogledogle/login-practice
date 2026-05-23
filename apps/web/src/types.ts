import type { PublicUser } from "@login-practice/shared";

// 登录成功后统一交回 App 处理，便于 Cookie 与 JWT 模式共享同一套状态更新逻辑。
export type AuthHandler = (result: { user: PublicUser; token?: string }) => Promise<void>;

// 登录页签只描述前端展示方式，实际认证模式由 AuthMode 决定。
export type LoginTab = "password" | "sms" | "qr";
