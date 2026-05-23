import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import type { AuthMode, PublicUser } from "@login-practice/shared";
import { api, getStoredToken, setStoredToken } from "./api";
import { AppHeader } from "./components/AppHeader";
import { Toast } from "./components/Toast";
import { DebugPage } from "./pages/DebugPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { QrConfirmPage } from "./pages/QrConfirmPage";
import { RegisterPage } from "./pages/RegisterPage";
import type { AuthHandler } from "./types";

export function App() {
  const [mode, setMode] = useState<AuthMode>(
    () => (localStorage.getItem("login-practice-mode") as AuthMode | null) ?? "cookie"
  );
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState("正在检查登录状态...");
  const [toast, setToast] = useState("");

  useEffect(() => {
    localStorage.setItem("login-practice-mode", mode);
  }, [mode]);

  async function refreshMe() {
    try {
      const res = await api.me();
      setUser(res.user);
      setStatus("已登录");
    } catch {
      setUser(null);
      setStatus("未登录");
    }
  }

  useEffect(() => {
    void refreshMe();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function onAuth(result: Parameters<AuthHandler>[0]) {
    setStoredToken(result.token ?? null);
    setUser(result.user);
    setStatus("登录成功");
  }

  async function logout() {
    await api.logout().catch(() => undefined);
    setStoredToken(null);
    setUser(null);
    setStatus("已退出");
  }

  return (
    <div className="shell">
      <AppHeader
        canOpenProfile={Boolean(user)}
        onBlockedProfile={() => setToast("请先登录后再进入个人中心")}
      />

      <main>
        <Routes>
          <Route
            path="/"
            element={<LoginPage mode={mode} onModeChange={setMode} onAuth={onAuth} />}
          />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/profile"
            element={user ? <ProfilePage user={user} onLogout={logout} /> : <Navigate to="/" />}
          />
          <Route
            path="/debug"
            element={
              <DebugPage
                mode={mode}
                onModeChange={setMode}
                user={user}
                status={status}
                token={getStoredToken()}
                onRefresh={refreshMe}
                onLogout={logout}
              />
            }
          />
          <Route path="/qr/confirm/:id" element={<QrConfirmPage />} />
        </Routes>
      </main>

      <Toast message={toast} />
    </div>
  );
}
