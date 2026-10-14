// Downloads the tafsir texts the explain panel uses and writes one small file per ayah to
// public/data/tafsir/<slug>/<surah>/<ayah>.json, so they are served with the site instead of
// through jsDelivr's GitHub proxy (whose cold cache took 2-17 s per ayah).
//
//   node scripts/fetch-tafsir.mjs
//
// Source and commit come from src/lib/tafsir.ts, so the text is exactly what the app pinned.
// Texts are copied verbatim; only the `text` field is kept. Output is generated, not committed.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const lib = await readFile(path.join(root, "src/lib/tafsir.ts"), "utf8");
const commit = lib.match(/const COMMIT = "([0-9a-f]{40})"/)?.[1];
const slugs = [...lib.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]);
if (!commit || slugs.length !== 4) throw new Error("Could not read COMMIT and the four slugs from src/lib/tafsir.ts");

const index = JSON.parse(await readFile(path.join(root, "src/data/index.json"), "utf8"));
const RAW = `https://raw.githubusercontent.com/spa5k/tafsir_api/${commit}/tafsir`;
const outDir = path.join(root, "public/data/tafsir");

async function get(url, tries = 4) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i >= tries) throw new Error(`${url}: ${e.message}`);
      await new Promise((r) => setTimeout(r, 500 * i));
    }
  }
}

await rm(outDir, { recursive: true, force: true });
const jobs = slugs.flatMap((slug) => index.surahs.map((s) => ({ slug, s })));
let done = 0;
let files = 0;
async function worker() {
  for (let job; (job = jobs.shift()); ) {
    const { slug, s } = job;
    const ayahs = await get(`${RAW}/${slug}/${s.n}.json`);
    if (!Array.isArray(ayahs) || ayahs.length !== s.count) throw new Error(`${slug}/${s.n}: expected ${s.count} ayahs, got ${ayahs?.length}`);
    const dir = path.join(outDir, slug, String(s.n));
    await mkdir(dir, { recursive: true });
    for (const [i, a] of ayahs.entries()) {
      if (a.surah !== s.n || a.ayah !== i + 1) throw new Error(`${slug}/${s.n}: entry ${i} is ${a.surah}:${a.ayah}`);
      await writeFile(path.join(dir, `${i + 1}.json`), JSON.stringify({ text: a.text ?? "" }));
      files++;
    }
    if (++done % 57 === 0) console.log(`${done}/${slugs.length * index.surahs.length} surahs`);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`Wrote ${files} ayah files for ${slugs.join(", ")} at ${commit.slice(0, 7)}.`);
