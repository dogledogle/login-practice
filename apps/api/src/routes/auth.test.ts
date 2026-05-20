import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { prisma } from "../prisma";

const app = createApp();

async function registerUser(overrides: Record<string, unknown> = {}) {
  const payload = {
    email: "ada@example.com",
    password: "password123",
    displayName: "Ada",
    phone: "13800138000",
    ...overrides
  };
  const res = await request(app).post("/auth/register").send(payload);
  expect(res.status).toBe(201);
  return payload;
}

describe("auth", () => {
  it("registers a user and rejects duplicate accounts", async () => {
    await registerUser();
    const duplicate = await request(app).post("/auth/register").send({
      email: "ada@example.com",
      password: "password123",
      displayName: "Ada 2"
    });

    expect(duplicate.status).toBe(409);
  });

  it("supports cookie password login and /me", async () => {
    const user = await registerUser();
    const agent = request.agent(app);

    const login = await agent.post("/auth/login/password").send({
      email: user.email,
      password: user.password,
      mode: "cookie"
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeUndefined();

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(user.email);
  });

  it("supports jwt password login and rejects wrong passwords", async () => {
    const user = await registerUser();

    const wrong = await request(app).post("/auth/login/password").send({
      email: user.email,
      password: "wrong-password",
      mode: "jwt"
    });
    expect(wrong.status).toBe(401);

    const login = await request(app).post("/auth/login/password").send({
      email: user.email,
      password: user.password,
      mode: "jwt"
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));

    const me = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(user.email);
  });

  it("supports sms code login and one-time code usage", async () => {
    const user = await registerUser();

    const requestCode = await request(app)
      .post("/auth/login/sms/request-code")
      .send({ phone: user.phone });
    expect(requestCode.status).toBe(200);
    expect(requestCode.body.devCode).toMatch(/^\d{6}$/);

    const login = await request(app).post("/auth/login/sms/verify").send({
      phone: user.phone,
      code: requestCode.body.devCode,
      mode: "jwt"
    });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));

    const reuse = await request(app).post("/auth/login/sms/verify").send({
      phone: user.phone,
      code: requestCode.body.devCode,
      mode: "jwt"
    });
    expect(reuse.status).toBe(401);
  });

  it("locks sms code verification after repeated wrong attempts", async () => {
    const user = await registerUser();
    await request(app).post("/auth/login/sms/request-code").send({ phone: user.phone });

    for (let i = 0; i < 5; i += 1) {
      const wrong = await request(app).post("/auth/login/sms/verify").send({
        phone: user.phone,
        code: "000000",
        mode: "cookie"
      });
      expect(wrong.status).toBe(401);
    }

    const locked = await request(app).post("/auth/login/sms/verify").send({
      phone: user.phone,
      code: "000000",
      mode: "cookie"
    });
    expect(locked.status).toBe(429);
  });

  it("rejects expired sms codes", async () => {
    const user = await registerUser();
    const requestCode = await request(app)
      .post("/auth/login/sms/request-code")
      .send({ phone: user.phone });
    await prisma.smsCode.updateMany({
      where: { phone: user.phone },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });

    const expired = await request(app).post("/auth/login/sms/verify").send({
      phone: user.phone,
      code: requestCode.body.devCode,
      mode: "jwt"
    });
    expect(expired.status).toBe(401);
  });

  it("supports qr challenge scan and confirm flow", async () => {
    const user = await registerUser();
    const challenge = await request(app)
      .post("/auth/qr/challenges")
      .send({ mode: "jwt" });
    expect(challenge.status).toBe(201);
    expect(challenge.body.status).toBe("pending");

    const scanned = await request(app)
      .post(`/auth/qr/challenges/${challenge.body.id}/scan`)
      .send({});
    expect(scanned.status).toBe(200);
    expect(scanned.body.status).toBe("scanned");

    const confirmed = await request(app)
      .post(`/auth/qr/challenges/${challenge.body.id}/confirm`)
      .send({ email: user.email, password: user.password });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe("confirmed");

    const polled = await request(app).get(`/auth/qr/challenges/${challenge.body.id}`);
    expect(polled.status).toBe(200);
    expect(polled.body.token).toEqual(expect.any(String));
    expect(polled.body.user.email).toBe(user.email);
  });

  it("supports qr rejection", async () => {
    const challenge = await request(app)
      .post("/auth/qr/challenges")
      .send({ mode: "cookie" });

    const rejected = await request(app)
      .post(`/auth/qr/challenges/${challenge.body.id}/reject`)
      .send({});
    expect(rejected.status).toBe(200);
    expect(rejected.body.status).toBe("rejected");
  });

  it("marks expired qr challenges as expired", async () => {
    const challenge = await request(app)
      .post("/auth/qr/challenges")
      .send({ mode: "jwt" });
    await prisma.qrLoginChallenge.update({
      where: { id: challenge.body.id },
      data: { expiresAt: new Date(Date.now() - 1000) }
    });

    const polled = await request(app).get(`/auth/qr/challenges/${challenge.body.id}`);
    expect(polled.status).toBe(200);
    expect(polled.body.status).toBe("expired");
  });
});
