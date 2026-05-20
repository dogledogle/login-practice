import { z } from "zod";

export const authModeSchema = z.enum(["cookie", "jwt"]);
export type AuthMode = z.infer<typeof authModeSchema>;

export const qrStatusSchema = z.enum([
  "pending",
  "scanned",
  "confirmed",
  "rejected",
  "expired"
]);
export type QrStatus = z.infer<typeof qrStatusSchema>;

export const publicUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string(),
  phone: z.string().nullable()
});
export type PublicUser = z.infer<typeof publicUserSchema>;

export const authResultSchema = z.object({
  user: publicUserSchema,
  token: z.string().optional(),
  mode: authModeSchema
});
export type AuthResult = z.infer<typeof authResultSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(40),
  phone: z.string().min(5).max(30).optional()
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const passwordLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  mode: authModeSchema
});
export type PasswordLoginInput = z.infer<typeof passwordLoginSchema>;

export const smsRequestSchema = z.object({
  phone: z.string().min(5).max(30)
});
export type SmsRequestInput = z.infer<typeof smsRequestSchema>;

export const smsVerifySchema = z.object({
  phone: z.string().min(5).max(30),
  code: z.string().regex(/^\d{6}$/),
  mode: authModeSchema
});
export type SmsVerifyInput = z.infer<typeof smsVerifySchema>;

export const qrChallengeCreateSchema = z.object({
  mode: authModeSchema
});
export type QrChallengeCreateInput = z.infer<typeof qrChallengeCreateSchema>;

export const qrChallengeSchema = z.object({
  id: z.string(),
  status: qrStatusSchema,
  expiresAt: z.string(),
  confirmUrl: z.string(),
  token: z.string().optional(),
  user: publicUserSchema.optional()
});
export type QrChallengeDto = z.infer<typeof qrChallengeSchema>;

export const qrScanSchema = z.object({
  userId: z.string().optional()
});
export type QrScanInput = z.infer<typeof qrScanSchema>;

export const qrConfirmSchema = z.object({
  email: z.string().email().optional(),
  password: z.string().min(1).optional()
});
export type QrConfirmInput = z.infer<typeof qrConfirmSchema>;

export const apiErrorSchema = z.object({
  error: z.string()
});
export type ApiError = z.infer<typeof apiErrorSchema>;
