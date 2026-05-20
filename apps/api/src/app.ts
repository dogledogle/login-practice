import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { errorHandler } from "./errors";
import { attachUser } from "./auth-middleware";
import { authRouter } from "./routes/auth";

export function createApp() {
  const app = express();

  app.use(cors({ origin: config.webOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(attachUser);

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.use("/auth", authRouter);
  app.use(errorHandler);

  return app;
}
