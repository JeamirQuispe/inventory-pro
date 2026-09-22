import type { Request, Response } from "express";
import { listQuerySchema } from "../../utils/pagination";

import { reportQuerySchema } from "./report.schema";
import * as reportService from "./report.service";

export async function dashboard(req: Request, res: Response) {
  const query = reportQuerySchema.parse(req.query);
  const report = await reportService.getDashboard(query);

  res.status(200).json(report);
}

export async function lowStock(req: Request, res: Response) {
  const products = await reportService.getLowStockProducts(listQuerySchema.parse(req.query));

  res.status(200).json(products);
}
