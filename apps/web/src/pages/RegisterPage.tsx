import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { PasswordField } from "../components/PasswordField";

// 注册页维护本地表单状态，提交成功后回到登录页继续练习登录流程。
export function RegisterPage() {
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
