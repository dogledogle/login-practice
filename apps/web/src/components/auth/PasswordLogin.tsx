import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { AuthMode } from "@login-practice/shared";
import { api } from "../../api";
import { PasswordField } from "../PasswordField";
import type { AuthHandler } from "../../types";

type PasswordLoginProps = {
  mode: AuthMode;
  onAuth: AuthHandler;
};

// 账号密码登录表单只处理表单状态和接口调用，登录后的全局状态交给 onAuth。
export function PasswordLogin({ mode, onAuth }: PasswordLoginProps) {
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
