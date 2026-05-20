import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import type { AuthMode, PublicUser, QrChallengeDto } from "@login-practice/shared";
import { api, getStoredToken, setStoredToken } from "./api";

type Tab = "password" | "sms" | "qr";

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

  async function onAuth(result: { user: PublicUser; token?: string }) {
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
      <header className="topbar">
        <Link to="/" className="brand">Login Practice</Link>
        <nav>
          <NavLink to="/" end>登录</NavLink>
          <NavLink to="/register">注册</NavLink>
          <NavLink
            to="/profile"
            onClick={(event) => {
              if (!user) {
                event.preventDefault();
                setToast("请先登录后再进入个人中心");
              }
            }}
          >
            个人中心
          </NavLink>
          <NavLink to="/debug">调试</NavLink>
        </nav>
      </header>

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

      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}

function LoginPage({
  mode,
  onModeChange,
  onAuth
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuth: (result: { user: PublicUser; token?: string }) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>("password");

  return (
    <section className="panel auth-panel">
      <div className="panel-head">
        <div>
          <p className="eyebrow">认证练习</p>
          <h1>登录模块训练场</h1>
        </div>
        <ModeSwitch mode={mode} onChange={onModeChange} />
      </div>

      <div className="tabs">
        <button className={tab === "password" ? "active" : ""} onClick={() => setTab("password")}>账号密码</button>
        <button className={tab === "sms" ? "active" : ""} onClick={() => setTab("sms")}>短信验证码</button>
        <button className={tab === "qr" ? "active" : ""} onClick={() => setTab("qr")}>扫码登录</button>
      </div>

      {tab === "password" && <PasswordLogin mode={mode} onAuth={onAuth} />}
      {tab === "sms" && <SmsLogin mode={mode} onAuth={onAuth} />}
      {tab === "qr" && <QrLogin mode={mode} onAuth={onAuth} />}
    </section>
  );
}

function ModeSwitch({
  mode,
  onChange
}: {
  mode: AuthMode;
  onChange: (mode: AuthMode) => void;
}) {
  return (
    <div className="mode-switch" aria-label="会话模式">
      <button className={mode === "cookie" ? "active" : ""} onClick={() => onChange("cookie")}>Cookie</button>
      <button className={mode === "jwt" ? "active" : ""} onClick={() => onChange("jwt")}>JWT</button>
    </div>
  );
}

function PasswordLogin({
  mode,
  onAuth
}: {
  mode: AuthMode;
  onAuth: (result: { user: PublicUser; token?: string }) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("ada@example.com");
  const [password, setPassword] = useState("password123");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("登录中...");
    try {
      const res = await api.loginPassword({ email, password, mode });
      await onAuth(res);
      navigate("/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "登录失败");
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>邮箱<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
      <PasswordField label="密码" value={password} onChange={setPassword} />
      <button type="submit">登录</button>
      <p className="message">{message}</p>
    </form>
  );
}

function SmsLogin({
  mode,
  onAuth
}: {
  mode: AuthMode;
  onAuth: (result: { user: PublicUser; token?: string }) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("13800138000");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");

  async function requestCode() {
    setMessage("发送中...");
    try {
      const res = await api.requestSms({ phone });
      setDevCode(res.devCode ?? "");
      setMessage(`验证码已生成，有效期 ${res.expiresInSeconds} 秒`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "发送失败");
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("验证中...");
    try {
      const res = await api.verifySms({ phone, code, mode });
      await onAuth(res);
      navigate("/profile");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "验证失败");
    }
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>手机号<input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
      <div className="inline-row">
        <label>验证码<input value={code} onChange={(e) => setCode(e.target.value)} /></label>
        <button type="button" onClick={requestCode}>获取验证码</button>
      </div>
      {devCode && <p className="dev-code">开发验证码：{devCode}</p>}
      <button type="submit">验证码登录</button>
      <p className="message">{message}</p>
    </form>
  );
}

function QrLogin({
  mode,
  onAuth
}: {
  mode: AuthMode;
  onAuth: (result: { user: PublicUser; token?: string }) => Promise<void>;
}) {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<QrChallengeDto | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [message, setMessage] = useState("");

  async function createChallenge() {
    setMessage("正在生成二维码...");
    const next = await api.createQrChallenge(mode);
    setChallenge(next);
    setQrDataUrl(await QRCode.toDataURL(next.confirmUrl, { width: 220, margin: 1 }));
    setMessage("请使用手机扫码确认");
  }

  useEffect(() => {
    void createChallenge().catch((error) =>
      setMessage(error instanceof Error ? error.message : "二维码创建失败")
    );
  }, [mode]);

  useEffect(() => {
    if (!challenge || ["confirmed", "rejected", "expired"].includes(challenge.status)) {
      return;
    }
    const timer = window.setInterval(async () => {
      try {
        const next = await api.getQrChallenge(challenge.id);
        setChallenge(next);
        if (next.status === "confirmed" && next.user) {
          await onAuth({ user: next.user, token: next.token });
          navigate("/profile");
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "轮询失败");
      }
    }, 1800);

    return () => window.clearInterval(timer);
  }, [challenge, navigate, onAuth]);

  const statusText = useMemo(() => {
    if (!challenge) return "未创建";
    return {
      pending: "等待手机扫码",
      scanned: "手机已扫码，等待确认",
      confirmed: "已确认",
      rejected: "已拒绝",
      expired: "已过期"
    }[challenge.status];
  }, [challenge]);

  return (
    <div className="qr-box">
      {qrDataUrl && <img src={qrDataUrl} alt="扫码登录二维码" />}
      <div>
        <p className="status-pill">{statusText}</p>
        <p className="message">{message}</p>
        <button type="button" onClick={createChallenge}>刷新二维码</button>
      </div>
    </div>
  );
}

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "ada@example.com",
    password: "password123",
    displayName: "Ada",
    phone: "13800138000"
  });
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("注册中...");
    try {
      await api.register(form);
      setMessage("注册成功，可以登录");
      navigate("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "注册失败");
    }
  }

  return (
    <section className="panel narrow">
      <p className="eyebrow">创建账号</p>
      <h1>注册练习用户</h1>
      <form className="form" onSubmit={submit}>
        <label>邮箱<input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label>昵称<input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} /></label>
        <label>手机号<input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <PasswordField
          label="密码"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
        />
        <button type="submit">注册</button>
        <p className="message">{message}</p>
      </form>
    </section>
  );
}

function ProfilePage({ user, onLogout }: { user: PublicUser; onLogout: () => Promise<void> }) {
  return (
    <section className="panel narrow">
      <p className="eyebrow">当前用户</p>
      <h1>{user.displayName}</h1>
      <dl className="details">
        <dt>邮箱</dt><dd>{user.email}</dd>
        <dt>手机号</dt><dd>{user.phone ?? "未设置"}</dd>
        <dt>用户 ID</dt><dd>{user.id}</dd>
      </dl>
      <button type="button" onClick={onLogout}>退出登录</button>
    </section>
  );
}

function DebugPage({
  mode,
  onModeChange,
  user,
  status,
  token,
  onRefresh,
  onLogout
}: {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  user: PublicUser | null;
  status: string;
  token: string | null;
  onRefresh: () => Promise<void>;
  onLogout: () => Promise<void>;
}) {
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

function QrConfirmPage() {
  const { id } = useParams();
  const [challenge, setChallenge] = useState<QrChallengeDto | null>(null);
  const [email, setEmail] = useState("ada@example.com");
  const [password, setPassword] = useState("password123");
  const [message, setMessage] = useState("正在打开扫码确认页...");

  useEffect(() => {
    if (!id) return;
    void api.scanQrChallenge(id)
      .then((res) => {
        setChallenge(res);
        setMessage("请在手机上确认是否登录电脑端");
      })
      .catch((error) => setMessage(error instanceof Error ? error.message : "扫码失败"));
  }, [id]);

  async function confirm() {
    if (!id) return;
    setMessage("确认中...");
    try {
      const res = await api.confirmQrChallenge(id, { email, password });
      setChallenge(res);
      setMessage("已确认，电脑端将自动完成登录");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "确认失败");
    }
  }

  async function reject() {
    if (!id) return;
    const res = await api.rejectQrChallenge(id);
    setChallenge(res);
    setMessage("已拒绝本次登录");
  }

  return (
    <section className="panel narrow qr-confirm-panel">
      <p className="eyebrow">手机确认</p>
      <h1>扫码登录确认</h1>
      <p className="status-pill">{challenge?.status ?? "loading"}</p>
      <p className="message">{message}</p>
      <form className="form qr-confirm-form" onSubmit={(event) => { event.preventDefault(); void confirm(); }}>
        <label>邮箱<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <PasswordField label="密码" value={password} onChange={setPassword} />
        <div className="qr-confirm-actions">
          <button type="submit">确认登录</button>
          <button type="button" className="secondary" onClick={reject}>拒绝登录</button>
        </div>
      </form>
    </section>
  );
}

function PasswordField({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label>
      {label}
      <span className="password-control">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="icon-button"
          aria-label={visible ? "隐藏密码" : "显示密码"}
          title={visible ? "隐藏密码" : "显示密码"}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </span>
    </label>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 3l18 18" />
      <path d="M10.7 5.2A9.3 9.3 0 0 1 12 5c6 0 9.5 7 9.5 7a15.6 15.6 0 0 1-3 4.1" />
      <path d="M6.4 6.4C3.9 8 2.5 12 2.5 12S6 19 12 19c1.8 0 3.3-.5 4.6-1.2" />
      <path d="M9.9 9.9A3 3 0 0 0 14.1 14" />
    </svg>
  );
}
