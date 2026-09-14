import type { Request, Response } from "express";

import {
  createStockAdjustmentSchema,
  stockMovementQuerySchema,
} from "./stock-movement.schema";
import * as stockMovementService from "./stock-movement.service";

export async function findAll(req: Request, res: Response) {
  const query = stockMovementQuerySchema.parse(req.query);
  const movements = await stockMovementService.findAll(query);

  res.status(200).json(movements);
}

export async function createAdjustment(req: Request, res: Response) {
  const data = createStockAdjustmentSchema.parse(req.body);
  const movement = await stockMovementService.createAdjustment(data, req.user!.id);

  res.status(201).json(movement);
}
