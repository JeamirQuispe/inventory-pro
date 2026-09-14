import type { Request, Response } from "express";

import {
  createSupplierSchema,
  supplierParamsSchema,
  updateSupplierSchema,
} from "./supplier.schema";
import * as supplierService from "./supplier.service";

export async function findAll(_req: Request, res: Response) {
  const suppliers = await supplierService.findAll();

  res.status(200).json(suppliers);
}

export async function findById(req: Request, res: Response) {
  const { id } = supplierParamsSchema.parse(req.params);
  const supplier = await supplierService.findById(id);

  res.status(200).json(supplier);
}

export async function create(req: Request, res: Response) {
  const data = createSupplierSchema.parse(req.body);
  const supplier = await supplierService.create(data);

  res.status(201).json(supplier);
}

export async function update(req: Request, res: Response) {
  const { id } = supplierParamsSchema.parse(req.params);
  const data = updateSupplierSchema.parse(req.body);
  const supplier = await supplierService.update(id, data);

  res.status(200).json(supplier);
}

export async function remove(req: Request, res: Response) {
  const { id } = supplierParamsSchema.parse(req.params);

  await supplierService.remove(id);

  res.status(204).send();
}
