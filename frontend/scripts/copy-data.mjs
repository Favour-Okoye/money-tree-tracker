// Copies the repo-level data/ catalog into public/data/ so dev + build serve a
// local snapshot (the app prefers the live raw.githubusercontent copy at runtime).
import { cpSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, "..", "..", "data");
const dest = path.resolve(here, "..", "public", "data");

mkdirSync(dest, { recursive: true });
if (existsSync(src)) {
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-data] ${src} -> ${dest}`);
} else {
  console.warn(`[copy-data] no data dir at ${src} (run the backfill)`);
}
