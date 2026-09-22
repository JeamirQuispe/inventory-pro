import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(12),
    JWT_EXPIRES_IN: z
      .string()
      .regex(/^[1-9]\d*(s|m|h|d)$/)
      .default("1d"),
    CORS_ORIGIN: z.string().default("http://localhost:5173"),
  })
  .refine((value) => value.NODE_ENV !== "production" || value.JWT_SECRET.length >= 32, {
    message: "Production JWT_SECRET requires at least 32 characters",
    path: ["JWT_SECRET"],
  });

export const env = envSchema.parse(process.env);
