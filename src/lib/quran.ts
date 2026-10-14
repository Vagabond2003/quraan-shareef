import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import raw from "@/data/index.json";
import type { Ayah, PageData, QuranIndex } from "./types";

export const index = raw as QuranIndex;

const dataDir = path.join(process.cwd(), "public/data");

// The dataset is static and generated before the build, so plain synchronous reads
// with a per-process memo are enough; no request data ever reaches these functions.
const memo = new Map<string, unknown>();
function readJson<T>(rel: string): T {
  if (!memo.has(rel)) memo.set(rel, JSON.parse(readFileSync(path.join(dataDir, rel), "utf8")));
  return memo.get(rel) as T;
}

export function getSurahAyahs(n: number): Ayah[] {
  return readJson<{ ayahs: Ayah[] }>(`surah/${n}.json`).ayahs;
}

export function getPage(p: number): PageData {
  return readJson<PageData>(`page/${p}.json`);
}
