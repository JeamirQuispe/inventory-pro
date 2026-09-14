import jwt from "jsonwebtoken";

import { env } from "../config/env";

type TokenPayload = {
  userId: string;
  role: string;
};

export type JwtPayload = TokenPayload;

export function signToken(payload: TokenPayload) {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
