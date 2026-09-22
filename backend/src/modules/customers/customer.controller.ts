import type { Request, Response } from "express";
import { listQuerySchema } from "../../utils/pagination";

import {
  createCustomerSchema,
  customerParamsSchema,
  updateCustomerSchema,
} from "./customer.schema";
import * as customerService from "./customer.service";

export async function findAll(req: Request, res: Response) {
  const customers = await customerService.findAll(listQuerySchema.parse(req.query));

  res.status(200).json(customers);
}

export async function findById(req: Request, res: Response) {
  const { id } = customerParamsSchema.parse(req.params);
  const customer = await customerService.findById(id);

  res.status(200).json(customer);
}

export async function create(req: Request, res: Response) {
  const data = createCustomerSchema.parse(req.body);
  const customer = await customerService.create(data);

  res.status(201).json(customer);
}

export async function update(req: Request, res: Response) {
  const { id } = customerParamsSchema.parse(req.params);
  const data = updateCustomerSchema.parse(req.body);
  const customer = await customerService.update(id, data);

  res.status(200).json(customer);
}

export async function remove(req: Request, res: Response) {
  const { id } = customerParamsSchema.parse(req.params);

  await customerService.remove(id);

  res.status(204).send();
}
