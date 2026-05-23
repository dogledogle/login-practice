import { useState } from "react";
import type { AuthMode } from "@login-practice/shared";
import { ModeSwitch } from "../components/ModeSwitch";
import { PasswordLogin } from "../components/auth/PasswordLogin";
import { QrLogin } from "../components/auth/QrLogin";
import { SmsLogin } from "../components/auth/SmsLogin";
import type { AuthHandler, LoginTab } from "../types";

type LoginPageProps = {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onAuth: AuthHandler;
};

// 登录页只负责组织三种登录方式，具体表单逻辑下沉到 auth 组件目录。
export function LoginPage({ mode, onModeChange, onAuth }: LoginPageProps) {
  const [tab, setTab] = useState<LoginTab>("password");

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
