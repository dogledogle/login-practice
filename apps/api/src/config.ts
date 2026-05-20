import "dotenv/config";

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:5173",
  sessionSecret: process.env.SESSION_SECRET ?? "local-session-secret",
  jwtSecret: process.env.JWT_SECRET ?? "local-jwt-secret",
  cookieName: process.env.COOKIE_NAME ?? "login_practice_sid",
  smsCodeTtlSeconds: Number(process.env.SMS_CODE_TTL_SECONDS ?? 300),
  qrTtlSeconds: Number(process.env.QR_TTL_SECONDS ?? 120)
};
