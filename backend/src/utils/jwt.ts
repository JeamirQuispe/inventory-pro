import jwt from "jsonwebtoken";

import { env } from "../config/env";

type TokenPayload = {
  userId: string;
  role: string;
  tokenVersion: number;
};

export type JwtPayload = TokenPayload;

export function signToken(payload: TokenPayload) {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string) {
  const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  if (
    typeof payload === "string" ||
    typeof payload.tokenVersion !== "number" ||
    typeof payload.userId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(payload.userId)
  ) {
    throw new Error("Invalid token payload");
  }
  return payload as JwtPayload;
}
