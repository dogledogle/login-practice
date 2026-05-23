import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import type { AuthMode, QrChallengeDto } from "@login-practice/shared";
import { api } from "../../api";
import type { AuthHandler } from "../../types";

type QrLoginProps = {
  mode: AuthMode;
  onAuth: AuthHandler;
};

// 电脑端扫码登录负责创建 challenge、生成二维码，并轮询后端确认状态。
export function QrLogin({ mode, onAuth }: QrLoginProps) {
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
