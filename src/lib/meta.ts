// Client-safe surah metadata (names, counts, start pages). About 12 KB.
import raw from "@/data/index.json";
import type { QuranIndex } from "./types";

export const quranIndex = raw as QuranIndex;
export const surahs = quranIndex.surahs;
export const PAGE_COUNT = quranIndex.pageCount;

export const surahMeta = (n: number) => surahs[n - 1];
export const juzStartPage = (j: number) => quranIndex.juz[String(j)]?.page ?? 1;
export const juzOfPage = (p: number) => {
  let j = 1;
  for (let i = 1; i <= 30; i++) if (juzStartPage(i) <= p) j = i;
  return j;
};
