// Builds the static Quran dataset used by the app.
//
//   node scripts/fetch-quran.mjs                 Arabic + English only
//   node scripts/fetch-quran.mjs --bn <ids>      also bundle Bengali translations (comma-separated)
//   node scripts/fetch-quran.mjs --en <ids>      choose English translations (default en.sahih,en.yusufali)
//
// Arabic: Tanzil Uthmani (`quran-uthmani`) and Simple (`quran-simple`) texts, both verbatim
// (attribution required, must not be altered). Readers choose the script in settings.
// English: Saheeh International (the text Ibrahim Walk's recorded audio reads; via Tanzil,
// non-commercial use with attribution) and Abdullah Yusuf Ali (1934). The first is the default.
// Bengali: alquran.cloud edition ids, e.g. `bn.bengali,bn.hoque` (Muhiuddin Khan, Zohurul Hoque).
// These come from Tanzil, which permits non-commercial use with attribution; commercial use
// needs permission from the translator or publisher. Nothing Bengali is bundled by default.
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { BN_SURAH_NAMES } from "./bn-surah-names.mjs";

const API = "https://api.alquran.cloud/v1/quran/";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const bnArg = process.argv.indexOf("--bn");
const enArg = process.argv.indexOf("--en");
const enIds = (enArg > -1 ? process.argv[enArg + 1] : "en.sahih,en.yusufali").split(",").map((s) => s.trim()).filter(Boolean);
const bnIds = bnArg > -1 ? process.argv[bnArg + 1].split(",").map((s) => s.trim()).filter(Boolean) : [];

async function edition(id) {
  process.stdout.write(`Fetching ${id}… `);
  const res = await fetch(API + id);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.data?.surahs?.length !== 114) throw new Error(`${id}: unexpected response`);
  console.log("done");
  return json.data;
}

const ar = await edition("quran-uthmani");
const simple = await edition("quran-simple");
const en = [];
for (const id of enIds) en.push(await edition(id));
const enEditions = en.map((e, i) => ({ id: enIds[i], name: e.edition.englishName, englishName: e.edition.englishName }));
const bn = [];
for (const id of bnIds) bn.push(await edition(id));
const bnEditions = bn.map((e, i) => ({ id: bnIds[i], name: e.edition.name, englishName: e.edition.englishName }));

const clean = (s) => s.replace(/^﻿/, "").trim();
const bismillah = clean(ar.surahs[0].ayahs[0].text);
const bismillahSimple = clean(simple.surahs[0].ayahs[0].text);
// The source prefixes every surah's first ayah with the Bismillah; the app draws it separately.
// Tanzil's Uthmani text writes it with a shadda on the bā' (بِّسْمِ) in surahs 95 and 97, so accept that spelling too.
const stripBismillah = (n, i, text, b) => {
  if (n === 1 || i !== 0) return text;
  const prefix = [b, b[0] + "\u0651" + b.slice(1)].find((p) => text.startsWith(p));
  return prefix ? text.slice(prefix.length).trim() : text;
};
const stripped = { ar: 0, simple: 0 };

const surahs = [];
const pages = new Map();
const juzStart = {};

for (const s of ar.surahs) {
  const n = s.number;
  const ayahs = s.ayahs.map((a, i) => {
    const sa = simple.surahs[n - 1].ayahs[i];
    if (sa.number !== a.number) throw new Error(`quran-simple out of step at ${n}:${a.numberInSurah}`);
    const raw = clean(a.text);
    const rawSimple = clean(sa.text);
    const text = stripBismillah(n, i, raw, bismillah);
    const textSimple = stripBismillah(n, i, rawSimple, bismillahSimple);
    if (text !== raw) stripped.ar++;
    if (textSimple !== rawSimple) stripped.simple++;
    const item = {
      k: a.numberInSurah,
      g: a.number,
      ar: text,
      as: textSimple,
      en: en.map((e) => clean(e.surahs[n - 1].ayahs[i].text)),
      ...(bn.length ? { bn: bn.map((e) => clean(e.surahs[n - 1].ayahs[i].text)) } : {}),
      page: a.page,
      juz: a.juz,
      hizbQ: a.hizbQuarter,
      ...(a.sajda ? { sajda: true } : {}),
    };
    if (!(a.juz in juzStart)) juzStart[a.juz] = { page: a.page, s: n, k: a.numberInSurah };
    if (!pages.has(a.page)) pages.set(a.page, { p: a.page, juz: a.juz, items: [] });
    pages.get(a.page).items.push({ s: n, k: a.numberInSurah, g: a.number, ar: text, as: textSimple, hizbQ: a.hizbQuarter });
    return item;
  });
  surahs.push({
    n,
    ar: s.name,
    en: s.englishName,
    meaning: s.englishNameTranslation,
    bn: BN_SURAH_NAMES[n - 1],
    type: s.revelationType === "Meccan" ? "meccan" : "medinan",
    count: ayahs.length,
    page: ayahs[0].page,
  });
  await mkdir(path.join(root, "public/data/surah"), { recursive: true });
  await writeFile(path.join(root, `public/data/surah/${n}.json`), JSON.stringify({ n, ayahs }));
}

await mkdir(path.join(root, "public/data/page"), { recursive: true });
for (const [p, data] of pages) {
  await writeFile(path.join(root, `public/data/page/${p}.json`), JSON.stringify(data));
}

await mkdir(path.join(root, "src/data"), { recursive: true });
await writeFile(
  path.join(root, "src/data/index.json"),
  JSON.stringify({ surahs, juz: juzStart, pageCount: pages.size, bismillah, bismillahSimple, hasBengali: bn.length > 0, bnEditions, enEditions }, null, 1),
);
if (stripped.ar !== stripped.simple) throw new Error(`Bismillah stripped from ${stripped.ar} Uthmani but ${stripped.simple} Simple first ayahs`);
console.log(`Stripped the Bismillah from ${stripped.ar} first ayahs in both scripts.`);
console.log(`Wrote ${surahs.length} surahs, ${pages.size} pages, English: ${enEditions.map((e) => e.englishName).join(", ")}, Bengali: ${bnEditions.map((e) => e.englishName).join(", ") || "none"}.`);
