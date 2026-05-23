import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import type { QrChallengeDto } from "@login-practice/shared";
import { api } from "../api";
import { PasswordField } from "../components/PasswordField";

// 手机端扫码确认页通过 URL 中的 challenge id 完成扫描、确认或拒绝操作。
export function QrConfirmPage() {
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

  function submit(event: FormEvent) {
    event.preventDefault();
    void confirm();
  }

  return (
    <section className="panel narrow qr-confirm-panel">
      <p className="eyebrow">手机确认</p>
      <h1>扫码登录确认</h1>
      <p className="status-pill">{challenge?.status ?? "loading"}</p>
      <p className="message">{message}</p>
      <form className="form qr-confirm-form" onSubmit={submit}>
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
