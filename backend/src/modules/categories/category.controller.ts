import type { Request, Response } from "express";
import { listQuerySchema } from "../../utils/pagination";

import {
  categoryParamsSchema,
  createCategorySchema,
  updateCategorySchema,
} from "./category.schema";
import * as categoryService from "./category.service";

export async function findAll(req: Request, res: Response) {
  const categories = await categoryService.findAll(listQuerySchema.parse(req.query));

  res.status(200).json(categories);
}

export async function findById(req: Request, res: Response) {
  const { id } = categoryParamsSchema.parse(req.params);
  const category = await categoryService.findById(id);

  res.status(200).json(category);
}

export async function create(req: Request, res: Response) {
  const data = createCategorySchema.parse(req.body);
  const category = await categoryService.create(data);

  res.status(201).json(category);
}

export async function update(req: Request, res: Response) {
  const { id } = categoryParamsSchema.parse(req.params);
  const data = updateCategorySchema.parse(req.body);
  const category = await categoryService.update(id, data);

  res.status(200).json(category);
}

export async function remove(req: Request, res: Response) {
  const { id } = categoryParamsSchema.parse(req.params);

  await categoryService.remove(id);

  res.status(204).send();
}
