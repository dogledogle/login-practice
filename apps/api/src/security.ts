import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Response } from "express";
import type { User } from "@prisma/client";
import { config } from "./config";
import { prisma } from "./prisma";

export function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    phone: user.phone
  };
}

export function signJwt(user: User) {
  return jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: "2h" });
}

export async function createCookieSession(res: Response, user: User) {
  const token = randomToken();
  await prisma.session.create({
    data: {
      tokenHash: sha256(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    }
  });

  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    path: "/",
    maxAge: 1000 * 60 * 60 * 24 * 7
  });
}

export function clearCookieSession(res: Response) {
  res.clearCookie(config.cookieName, { path: "/" });
}
