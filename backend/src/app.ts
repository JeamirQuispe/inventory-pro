import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env";

import { errorMiddleware } from "./middlewares/error.middleware";
import { router } from "./routes";

export const app = express();

app.use(helmet());
app.disable("x-powered-by");
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", router);
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use(errorMiddleware);
