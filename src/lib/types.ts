export type SurahMeta = {
  n: number;
  ar: string;
  en: string;
  meaning: string;
  bn: string;
  type: "meccan" | "medinan";
  count: number;
  page: number;
};

export type Ayah = {
  k: number;
  g: number;
  ar: string;
  /** One entry per bundled English edition, in the order of QuranIndex.enEditions. */
  en: string[];
  /** One entry per bundled Bengali edition, in the order of QuranIndex.bnEditions. */
  bn?: string[];
  page: number;
  juz: number;
  hizbQ: number;
  sajda?: boolean;
};

export type PageItem = { s: number; k: number; g: number; ar: string; hizbQ: number };
export type PageData = { p: number; juz: number; items: PageItem[] };

export type QuranIndex = {
  surahs: SurahMeta[];
  juz: Record<string, { page: number; s: number; k: number }>;
  pageCount: number;
  bismillah: string;
  hasBengali: boolean;
  bnEditions: { id: string; name: string; englishName: string }[];
  enEditions: { id: string; name: string; englishName: string }[];
};
