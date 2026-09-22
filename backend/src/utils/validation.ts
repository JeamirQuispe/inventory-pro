import { z } from "zod";

export const moneySchema = z
  .number()
  .positive()
  .max(99999999.99)
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.000001,
    "Use at most two decimal places",
  );
export const stockSchema = z.number().int().min(0).max(2147483647);
export const quantitySchema = stockSchema.min(1).max(1000000);
export const emailSchema = z.string().trim().toLowerCase().email();
export const passwordSchema = z
  .string()
  .min(8)
  .max(72)
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 72,
    "Password must not exceed 72 UTF-8 bytes",
  );
export const optionalEmailSchema = z
  .union([emailSchema, z.literal("")])
  .nullish()
  .transform((value) => (value === "" ? null : value));
export const optionalPhoneSchema = z
  .union([
    z.string().regex(/^[0-9]{9}$/, "El teléfono debe contener exactamente 9 dígitos."),
    z.literal(""),
  ])
  .nullish()
  .transform((value) => (value === "" ? null : value));
