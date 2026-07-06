import { existsSync } from "node:fs";

if (!existsSync("app")) {
  console.error("Expected Next.js app directory to exist.");
  process.exit(1);
}
