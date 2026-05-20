import { Router, type Response } from "express";
import {
  passwordLoginSchema,
  qrChallengeCreateSchema,
  qrConfirmSchema,
  registerSchema,
  smsRequestSchema,
  smsVerifySchema
} from "@login-practice/shared";
import { nanoid } from "nanoid";
import { config } from "../config";
import { HttpError } from "../errors";
import { prisma } from "../prisma";
import type { AuthedRequest } from "../auth-middleware";
import {
  clearCookieSession,
  createCookieSession,
  hashPassword,
  publicUser,
  randomToken,
  sha256,
  signJwt,
  verifyPassword
} from "../security";

export const authRouter = Router();

function expiresIn(seconds: number) {
  return new Date(Date.now() + seconds * 1000);
}

async function completeLogin(
  _req: AuthedRequest,
  res: Response,
  user: NonNullable<AuthedRequest["user"]>,
  mode: "cookie" | "jwt"
) {
  if (mode === "cookie") {
    await createCookieSession(res, user);
    res.json({ user: publicUser(user), mode });
    return;
  }

  res.json({ user: publicUser(user), token: signJwt(user), mode });
}

function challengeDto(challenge: {
  id: string;
  status: string;
  expiresAt: Date;
  mode: string;
  user?: NonNullable<AuthedRequest["user"]> | null;
}) {
  const isExpired =
    challenge.status !== "confirmed" &&
    challenge.status !== "rejected" &&
    challenge.expiresAt <= new Date();
  return {
    id: challenge.id,
    status: isExpired ? "expired" : challenge.status,
    expiresAt: challenge.expiresAt.toISOString(),
    confirmUrl: `${config.appBaseUrl}/qr/confirm/${challenge.id}`,
    user: challenge.user ? publicUser(challenge.user) : undefined
  };
}

async function getActiveChallenge(id: string) {
  const challenge = await prisma.qrLoginChallenge.findUnique({
    where: { id },
    include: { user: true }
  });
  if (!challenge) {
    throw new HttpError(404, "QR challenge not found");
  }
  if (
    challenge.expiresAt <= new Date() &&
    challenge.status !== "confirmed" &&
    challenge.status !== "rejected"
  ) {
    return prisma.qrLoginChallenge.update({
      where: { id },
      data: { status: "expired" },
      include: { user: true }
    });
  }
  return challenge;
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.email },
          ...(input.phone ? [{ phone: input.phone }] : [])
        ]
      }
    });
    if (existing) {
      throw new HttpError(409, "Email or phone already registered");
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        displayName: input.displayName,
        phone: input.phone,
        passwordHash: await hashPassword(input.password)
      }
    });

    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login/password", async (req, res, next) => {
  try {
    const input = passwordLoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new HttpError(401, "Invalid email or password");
    }

    await completeLogin(req, res, user, input.mode);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login/sms/request-code", async (req, res, next) => {
  try {
    const input = smsRequestSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { phone: input.phone } });
    if (!user) {
      throw new HttpError(404, "No user registered with that phone number");
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    await prisma.smsCode.create({
      data: {
        phone: input.phone,
        userId: user.id,
        codeHash: sha256(code),
        expiresAt: expiresIn(config.smsCodeTtlSeconds)
      }
    });

    console.log(`[mock-sms] ${input.phone}: ${code}`);
    res.json({
      ok: true,
      devCode: process.env.NODE_ENV === "production" ? undefined : code,
      expiresInSeconds: config.smsCodeTtlSeconds
    });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/login/sms/verify", async (req, res, next) => {
  try {
    const input = smsVerifySchema.parse(req.body);
    const smsCode = await prisma.smsCode.findFirst({
      where: { phone: input.phone, usedAt: null },
      orderBy: { createdAt: "desc" },
      include: { user: true }
    });

    if (!smsCode || smsCode.expiresAt <= new Date()) {
      throw new HttpError(401, "SMS code expired or not found");
    }
    if (smsCode.attempts >= 5) {
      throw new HttpError(429, "Too many SMS verification attempts");
    }
    if (smsCode.codeHash !== sha256(input.code)) {
      await prisma.smsCode.update({
        where: { id: smsCode.id },
        data: { attempts: { increment: 1 } }
      });
      throw new HttpError(401, "Invalid SMS code");
    }
    if (!smsCode.user) {
      throw new HttpError(404, "User not found");
    }

    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { usedAt: new Date() }
    });

    await completeLogin(req, res, smsCode.user, input.mode);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/logout", async (req: AuthedRequest, res, next) => {
  try {
    const cookieToken = req.cookies?.[config.cookieName];
    if (typeof cookieToken === "string") {
      await prisma.session.deleteMany({ where: { tokenHash: sha256(cookieToken) } });
    }
    clearCookieSession(res);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", (req: AuthedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  res.json({ user: publicUser(req.user) });
});

authRouter.post("/qr/challenges", async (req, res, next) => {
  try {
    const input = qrChallengeCreateSchema.parse(req.body);
    const id = nanoid(12);
    const token = randomToken();
    const challenge = await prisma.qrLoginChallenge.create({
      data: {
        id,
        mode: input.mode,
        tokenHash: sha256(token),
        expiresAt: expiresIn(config.qrTtlSeconds)
      }
    });

    res.status(201).json(challengeDto(challenge));
  } catch (error) {
    next(error);
  }
});

authRouter.get("/qr/challenges/:id", async (req, res, next) => {
  try {
    const challenge = await getActiveChallenge(req.params.id!);
    const dto = challengeDto(challenge);
    if (challenge.status === "confirmed" && challenge.user) {
      if (challenge.mode === "jwt") {
        res.json({ ...dto, token: signJwt(challenge.user) });
        return;
      }
      await createCookieSession(res, challenge.user);
    }
    res.json(dto);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/qr/challenges/:id/scan", async (req, res, next) => {
  try {
    const challenge = await getActiveChallenge(req.params.id!);
    if (challenge.status !== "pending") {
      throw new HttpError(409, `Cannot scan challenge in ${challenge.status} state`);
    }
    const updated = await prisma.qrLoginChallenge.update({
      where: { id: challenge.id },
      data: { status: "scanned", scannedAt: new Date() }
    });
    res.json(challengeDto(updated));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/qr/challenges/:id/confirm", async (req, res, next) => {
  try {
    const input = qrConfirmSchema.parse(req.body);
    const challenge = await getActiveChallenge(req.params.id!);
    if (challenge.status !== "pending" && challenge.status !== "scanned") {
      throw new HttpError(409, `Cannot confirm challenge in ${challenge.status} state`);
    }

    const userFromSession = (req as AuthedRequest).user;
    let user = userFromSession;
    if (!user && input.email && input.password) {
      const candidate = await prisma.user.findUnique({ where: { email: input.email } });
      if (candidate && (await verifyPassword(input.password, candidate.passwordHash))) {
        user = candidate;
      }
    }
    if (!user) {
      throw new HttpError(401, "Sign in on the phone or provide password credentials");
    }

    const updated = await prisma.qrLoginChallenge.update({
      where: { id: challenge.id },
      data: { status: "confirmed", userId: user.id, decidedAt: new Date() },
      include: { user: true }
    });
    res.json(challengeDto(updated));
  } catch (error) {
    next(error);
  }
});

authRouter.post("/qr/challenges/:id/reject", async (req, res, next) => {
  try {
    const challenge = await getActiveChallenge(req.params.id!);
    if (challenge.status !== "pending" && challenge.status !== "scanned") {
      throw new HttpError(409, `Cannot reject challenge in ${challenge.status} state`);
    }
    const updated = await prisma.qrLoginChallenge.update({
      where: { id: challenge.id },
      data: { status: "rejected", decidedAt: new Date() }
    });
    res.json(challengeDto(updated));
  } catch (error) {
    next(error);
  }
});
