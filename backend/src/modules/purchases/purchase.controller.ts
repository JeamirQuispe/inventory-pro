import type { Request, Response } from "express";
import { listQuerySchema } from "../../utils/pagination";

import { createPurchaseSchema, purchaseParamsSchema } from "./purchase.schema";
import * as purchaseService from "./purchase.service";

export async function findAll(req: Request, res: Response) {
  const purchases = await purchaseService.findAll(listQuerySchema.parse(req.query));

  res.status(200).json(purchases);
}

export async function findById(req: Request, res: Response) {
  const { id } = purchaseParamsSchema.parse(req.params);
  const purchase = await purchaseService.findById(id);

  res.status(200).json(purchase);
}

export async function create(req: Request, res: Response) {
  const data = createPurchaseSchema.parse(req.body);
  const purchase = await purchaseService.create(data, req.user!.id);

  res.status(201).json(purchase);
}
