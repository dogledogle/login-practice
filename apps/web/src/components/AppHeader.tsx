import { Link, NavLink } from "react-router-dom";

type AppHeaderProps = {
  canOpenProfile: boolean;
  onBlockedProfile: () => void;
};

// 顶部导航负责全局入口展示，并在未登录访问个人中心时交给 App 显示提示。
export function AppHeader({ canOpenProfile, onBlockedProfile }: AppHeaderProps) {
  return (
    <header className="topbar">
      <Link to="/" className="brand">Login Practice</Link>
      <nav>
        <NavLink to="/" end>登录</NavLink>
        <NavLink to="/register">注册</NavLink>
        <NavLink
          to="/profile"
          onClick={(event) => {
            if (!canOpenProfile) {
              event.preventDefault();
              onBlockedProfile();
            }
          }}
        >
          个人中心
        </NavLink>
        <NavLink to="/debug">调试</NavLink>
      </nav>
    </header>
  );
}
