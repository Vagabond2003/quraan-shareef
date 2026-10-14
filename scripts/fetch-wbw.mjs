// Builds the word-by-word dataset: public/data/wbw/<surah>.json, loaded only when a reader turns on
// word-by-word reading.
//
//   node scripts/fetch-wbw.mjs
//
// Source: the Quran.com API (v4). Each word's Uthmani and Imlaei (simple) Arabic, its Bengali and
// English meaning, and its transliteration are copied verbatim. Ayah-end markers are dropped (the
// app draws its own). Word recordings are not stored: the app builds their Quran.com CDN URL.
//
// Output per surah: { n, ayahs: [[[uthmani, simple, bn, en, translit], ...], ...] }, ayahs in order.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const API = "https://api.quran.com/api/v4/verses/by_chapter";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const index = JSON.parse(await readFile(path.join(root, "src/data/index.json"), "utf8"));
const outDir = path.join(root, "public/data/wbw");

async function chapter(n, language) {
  const url = `${API}/${n}?words=true&language=${language}&word_fields=text_uthmani,text_imlaei&per_page=300`;
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()).verses;
    } catch (e) {
      if (i >= 4) throw new Error(`${n} (${language}): ${e.message}`);
      await new Promise((r) => setTimeout(r, 1000 * i));
    }
  }
}

await mkdir(outDir, { recursive: true });
let words = 0;
for (const s of index.surahs) {
  const [bn, en] = await Promise.all([chapter(s.n, "bn"), chapter(s.n, "en")]);
  if (bn.length !== s.count || en.length !== s.count) throw new Error(`${s.n}: expected ${s.count} ayahs, got ${bn.length}/${en.length}`);
  const ayahs = bn.map((v, i) => {
    const e = en[i];
    if (v.verse_key !== `${s.n}:${i + 1}` || e.verse_key !== v.verse_key) throw new Error(`${s.n}: ayah ${i + 1} out of order`);
    const vw = v.words.filter((w) => w.char_type_name === "word");
    const ew = e.words.filter((w) => w.char_type_name === "word");
    if (!vw.length || vw.length !== ew.length) throw new Error(`${v.verse_key}: word counts differ (${vw.length}/${ew.length})`);
    return vw.map((w, j) => {
      if (w.position !== j + 1 || ew[j].position !== j + 1 || ew[j].text_uthmani !== w.text_uthmani) throw new Error(`${v.verse_key}: word ${j + 1} mismatch`);
      if (w.translation.language_name !== "bengali" || ew[j].translation.language_name !== "english") throw new Error(`${v.verse_key}: word ${j + 1} meaning in the wrong language`);
      words++;
      return [w.text_uthmani, w.text_imlaei, w.translation.text, ew[j].translation.text, w.transliteration.text ?? ""];
    });
  });
  await writeFile(path.join(outDir, `${s.n}.json`), JSON.stringify({ n: s.n, ayahs }));
  if (s.n % 19 === 0) console.log(`${s.n}/114`);
}
console.log(`Wrote word-by-word data for 114 surahs, ${words} words.`);
