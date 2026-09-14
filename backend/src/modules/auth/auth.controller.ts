import type { Request, Response } from "express";

import { loginSchema } from "./auth.schema";
import * as authService from "./auth.service";

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const result = await authService.login(data);

  res.status(200).json(result);
}

export async function me(req: Request, res: Response) {
  const result = await authService.getProfile(req.user!.id);

  res.status(200).json(result);
}
