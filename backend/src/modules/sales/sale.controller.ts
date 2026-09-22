import type { Request, Response } from "express";
import { listQuerySchema } from "../../utils/pagination";

import { createSaleSchema, saleParamsSchema } from "./sale.schema";
import * as saleService from "./sale.service";

export async function findAll(req: Request, res: Response) {
  const sales = await saleService.findAll(listQuerySchema.parse(req.query));

  res.status(200).json(sales);
}

export async function findById(req: Request, res: Response) {
  const { id } = saleParamsSchema.parse(req.params);
  const sale = await saleService.findById(id);

  res.status(200).json(sale);
}

export async function create(req: Request, res: Response) {
  const data = createSaleSchema.parse(req.body);
  const sale = await saleService.create(data, req.user!.id);

  res.status(201).json(sale);
}
