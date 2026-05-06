import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const contentVersionFile = join(root, "src/content/content-version.ts");

if (!existsSync(contentVersionFile)) {
  mkdirSync(dirname(contentVersionFile), { recursive: true });
  writeFileSync(contentVersionFile, 'export const contentVersion = "initial";\n');
}
