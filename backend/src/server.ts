import { app } from "./app";
import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`InventoryPro API running on port ${env.PORT}`);
});
