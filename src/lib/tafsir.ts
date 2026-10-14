// Scholarly explanations (tafsir), fetched per ayah on demand from the spa5k/tafsir_api
// collection on jsDelivr. The commit is pinned so the text can never change underneath the app;
// update it deliberately after checking the new content.
const COMMIT = "eb82bb6294efe30ad5c135c03b1864afaa70e855";
const BASE = `https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@${COMMIT}/tafsir`;

export type ExplainLang = "bn" | "en";
export type ExplainDepth = "plain" | "detail";

export type TafsirSource = { slug: string; name: string; by: string; url: string };

export const TAFSIR: Record<ExplainDepth, Record<ExplainLang, TafsirSource>> = {
  plain: {
    bn: {
      slug: "bengali-mokhtasar",
      name: "আল-মুখতাসার ফিত-তাফসীর",
      by: "Tafsir Center for Quranic Studies",
      url: "https://qul.tarteel.ai/resources/tafsir/267",
    },
    en: {
      slug: "en-tafsir-al-mukhtasar",
      name: "Al-Mukhtasar fi al-Tafsir",
      by: "Tafsir Center for Quranic Studies",
      url: "https://qul.tarteel.ai/resources/tafsir/266",
    },
  },
  detail: {
    bn: {
      slug: "bn-tafsir-ahsanul-bayaan",
      name: "তাফসীর আহসানুল বায়ান",
      by: "Bayaan Foundation",
      url: "https://qul.tarteel.ai/resources/tafsir/32",
    },
    en: {
      slug: "en-tafisr-ibn-kathir",
      name: "Tafsir Ibn Kathir (abridged)",
      by: "Hafiz Ibn Kathir",
      url: "https://qul.tarteel.ai/resources/tafsir/35",
    },
  },
};

export const TAFSIR_HOST_PREFIX = `${BASE}/`;

const cache = new Map<string, Promise<string>>();

/** The tafsir text for one ayah, or "" when the source explains it together with neighbouring ayahs. */
export function getTafsir(src: TafsirSource, s: number, k: number): Promise<string> {
  const key = `${src.slug}/${s}/${k}`;
  let hit = cache.get(key);
  if (!hit) {
    hit = fetch(`${BASE}/${key}.json`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { text?: string }) => (d.text ?? "").trim());
    // A failed request should be retryable, not cached.
    hit.catch(() => cache.delete(key));
    cache.set(key, hit);
  }
  return hit;
}
