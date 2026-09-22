import { prepareTestDatabase } from "./database";

async function main() {
  const { db } = await prepareTestDatabase();
  await db.$disconnect();
  const { app } = await import("../src/app");
  app.listen(4001, "127.0.0.1", () => console.log("Test API ready on 4001"));
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
