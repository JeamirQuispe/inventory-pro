import type { Request, Response } from "express";

import {
  createUserSchema,
  updateUserSchema,
  userParamsSchema,
} from "./user.schema";
import * as userService from "./user.service";

export async function findAll(_req: Request, res: Response) {
  const users = await userService.findAll();

  res.status(200).json(users);
}

export async function findById(req: Request, res: Response) {
  const { id } = userParamsSchema.parse(req.params);
  const user = await userService.findById(id);

  res.status(200).json(user);
}

export async function create(req: Request, res: Response) {
  const data = createUserSchema.parse(req.body);
  const user = await userService.create(data);

  res.status(201).json(user);
}

export async function update(req: Request, res: Response) {
  const { id } = userParamsSchema.parse(req.params);
  const data = updateUserSchema.parse(req.body);
  const user = await userService.update(id, data);

  res.status(200).json(user);
}

export async function remove(req: Request, res: Response) {
  const { id } = userParamsSchema.parse(req.params);

  await userService.remove(id);

  res.status(204).send();
}
