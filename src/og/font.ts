import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadIsYunFont() {
  const font = await readFile(
    path.join(process.cwd(), "public/fonts/LeeSeoyun.woff"),
  );
  return font.buffer.slice(
    font.byteOffset,
    font.byteOffset + font.byteLength,
  ) as ArrayBuffer;
}
