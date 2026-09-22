import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { AppError } from "../utils/AppError";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      message: "Validation error",
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const known: Record<string, [number, string]> = {
      P2002: [409, "A record with this unique value already exists"],
      P2003: [409, "A related record prevents this operation"],
      P2025: [404, "Record not found"],
      P2034: [409, "Concurrent change detected. Please try again"],
      P2020: [400, "Value exceeds the supported range"],
    };
    const mapped = known[error.code];
    if (!mapped) console.error(error);
    res.status(mapped?.[0] ?? 500).json({ message: mapped?.[1] ?? "Internal server error" });
    return;
  }

  if (error?.type === "entity.parse.failed" || error?.type === "entity.too.large") {
    res
      .status(error.type === "entity.too.large" ? 413 : 400)
      .json({ message: "Invalid JSON request body" });
    return;
  }

  console.error(error);
  res.status(500).json({
    message: "Internal server error",
  });
};
