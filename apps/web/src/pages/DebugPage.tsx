import type { AuthMode, PublicUser } from "@login-practice/shared";
import { ModeSwitch } from "../components/ModeSwitch";

type DebugPageProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  user: PublicUser | null;
  status: string;
  token: string | null;
  onRefresh: () => Promise<void>;
  onLogout: () => Promise<void>;
};

// 调试页集中展示当前登录状态与 JWT，便于验证 Cookie/JWT 两种会话模式。
export function DebugPage({
  mode,
  onModeChange,
  user,
  status,
  token,
  onRefresh,
  onLogout
}: DebugPageProps) {
  return (
    <section className="panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">会话调试</p>
          <h1>Cookie / JWT 状态</h1>
        </div>
        <ModeSwitch mode={mode} onChange={onModeChange} />
      </div>
      <div className="debug-grid">
        <div>
          <h2>登录状态</h2>
          <p>{status}</p>
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
        <div>
          <h2>JWT</h2>
          <pre>{token ?? "当前没有 JWT，Cookie 模式的 Session 在 HttpOnly Cookie 中"}</pre>
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={onRefresh}>刷新 /auth/me</button>
        <button type="button" onClick={onLogout}>退出</button>
      </div>
    </section>
  );
}
