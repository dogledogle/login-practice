import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthMode } from "@login-practice/shared";
import { api } from "../../api";
import type { AuthHandler } from "../../types";

type SmsLoginProps = {
  mode: AuthMode;
  onAuth: AuthHandler;
};

// Mock 短信登录表单保留开发验证码展示，方便本地练习完整验证码流程。
export function SmsLogin({ mode, onAuth }: SmsLoginProps) {
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
