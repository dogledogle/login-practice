import { execFileSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, beforeEach } from "vitest";

const dbPath = join(process.cwd(), "prisma", "test.db");

process.env.DATABASE_URL = "file:./test.db";
process.env.SESSION_SECRET = "test-session-secret";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.NODE_ENV = "test";

const { prisma } = await import("../prisma");
const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

beforeAll(async () => {
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
  execFileSync(npxCommand, ["prisma", "db", "push", "--skip-generate"], {
    cwd: process.cwd(),
    stdio: "ignore",
    env: process.env
  });
});

beforeEach(async () => {
  await prisma.qrLoginChallenge.deleteMany();
  await prisma.smsCode.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
  if (existsSync(dbPath)) {
    unlinkSync(dbPath);
  }
});
