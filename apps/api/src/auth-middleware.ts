import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@prisma/client";
import { config } from "./config";
import { prisma } from "./prisma";
import { sha256 } from "./security";

export type AuthedRequest = Request & {
  user?: User;
};

export async function resolveUser(req: Request) {
  const authHeader = req.header("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(authHeader.slice("Bearer ".length), config.jwtSecret);
      if (typeof payload === "object" && typeof payload.sub === "string") {
        return prisma.user.findUnique({ where: { id: payload.sub } });
      }
    } catch {
      return null;
    }
  }

  const cookieToken = req.cookies?.[config.cookieName];
  if (typeof cookieToken === "string") {
    const session = await prisma.session.findUnique({
      where: { tokenHash: sha256(cookieToken) },
      include: { user: true }
    });
    if (session && session.expiresAt > new Date()) {
      return session.user;
    }
  }

  return null;
}

export async function attachUser(
  req: AuthedRequest,
  _res: Response,
  next: NextFunction
) {
  req.user = (await resolveUser(req)) ?? undefined;
  next();
}
