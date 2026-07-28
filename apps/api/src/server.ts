import "dotenv/config";
import { startServer } from "./bootstrap/server";

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});