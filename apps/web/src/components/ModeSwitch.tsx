import type { AuthMode } from "@login-practice/shared";

type ModeSwitchProps = {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
};

// Cookie 与 JWT 的切换按钮在登录页和调试页复用，保证两处模式入口一致。
export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="mode-switch" aria-label="会话模式">
      <button className={mode === "cookie" ? "active" : ""} onClick={() => onChange("cookie")}>Cookie</button>
      <button className={mode === "jwt" ? "active" : ""} onClick={() => onChange("jwt")}>JWT</button>
    </div>
  );
}
