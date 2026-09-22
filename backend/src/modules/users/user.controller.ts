import type { Request, Response } from "express";
import { listQuerySchema } from "../../utils/pagination";
import { AppError } from "../../utils/AppError";

import { createUserSchema, updateUserSchema, userParamsSchema } from "./user.schema";
import * as userService from "./user.service";

export async function findAll(req: Request, res: Response) {
  const users = await userService.findAll(listQuerySchema.parse(req.query));

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
  if (
    id === req.user!.id &&
    (data.isActive === false || (data.role && data.role !== req.user!.role))
  ) {
    throw new AppError("You cannot deactivate yourself or change your own role", 409);
  }
  const user = await userService.update(id, data);

  res.status(200).json(user);
}

export async function remove(req: Request, res: Response) {
  const { id } = userParamsSchema.parse(req.params);
  if (id === req.user!.id) throw new AppError("You cannot deactivate your own account", 409);

  await userService.remove(id);

  res.status(204).send();
}
