import type { Request, Response } from "express";

import {
  createProductSchema,
  productParamsSchema,
  updateProductSchema,
} from "./product.schema";
import * as productService from "./product.service";

export async function findAll(_req: Request, res: Response) {
  const products = await productService.findAll();

  res.status(200).json(products);
}

export async function findById(req: Request, res: Response) {
  const { id } = productParamsSchema.parse(req.params);
  const product = await productService.findById(id);

  res.status(200).json(product);
}

export async function create(req: Request, res: Response) {
  const data = createProductSchema.parse(req.body);
  const product = await productService.create(data);

  res.status(201).json(product);
}

export async function update(req: Request, res: Response) {
  const { id } = productParamsSchema.parse(req.params);
  const data = updateProductSchema.parse(req.body);
  const product = await productService.update(id, data);

  res.status(200).json(product);
}

export async function remove(req: Request, res: Response) {
  const { id } = productParamsSchema.parse(req.params);

  await productService.remove(id);

  res.status(204).send();
}
