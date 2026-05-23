import type { PublicUser } from "@login-practice/shared";

type ProfilePageProps = {
  user: PublicUser;
  onLogout: () => Promise<void>;
};

// 个人中心展示后端返回的公开用户信息，不在这里读取 token 或 session。
export function ProfilePage({ user, onLogout }: ProfilePageProps) {
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
