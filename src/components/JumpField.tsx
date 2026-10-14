"use client";
import { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PAGE_COUNT, juzStartPage, surahMeta, surahs } from "@/lib/meta";
import { bnNum, latinDigits } from "@/lib/num";

type Hit = { href: string; title: string; sub: string };

const ALIASES: Record<string, [number, number]> = {
  "ayatul kursi": [2, 255],
  "ayat al kursi": [2, 255],
  kursi: [2, 255],
  "আয়াতুল কুরসি": [2, 255],
  "আয়াতুল কুরসী": [2, 255],
};

const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();

function search(raw: string): Hit[] {
  const q = latinDigits(raw).trim();
  if (!q) return [];
  const hits: Hit[] = [];
  const ref = q.match(/^(\d{1,3})\s*[:.\s]\s*(\d{1,3})$/);
  if (ref) {
    const s = +ref[1];
    const k = +ref[2];
    if (s >= 1 && s <= 114 && k >= 1 && k <= surahMeta(s).count) {
      hits.push({ href: `/surah/${s}#a-${k}`, title: `${surahMeta(s).bn} ${bnNum(s)}:${bnNum(k)}`, sub: "আয়াতে যান" });
    }
  }
  const page = q.match(/^(?:p|page|পৃষ্ঠা|পৃ)\.?\s*(\d{1,3})$/i);
  if (page && +page[1] >= 1 && +page[1] <= PAGE_COUNT) {
    hits.push({ href: `/mushaf/${page[1]}`, title: `পৃষ্ঠা ${bnNum(+page[1])}`, sub: "মুসহাফে খুলুন" });
  }
  const juz = q.match(/^(?:juz|para|পারা|জুজ|জুয)\s*(\d{1,2})$/i);
  if (juz && +juz[1] >= 1 && +juz[1] <= 30) {
    hits.push({ href: `/mushaf/${juzStartPage(+juz[1])}`, title: `পারা ${bnNum(+juz[1])}`, sub: `পৃষ্ঠা ${bnNum(juzStartPage(+juz[1]))} থেকে` });
  }
  if (/^\d{1,3}$/.test(q) && +q >= 1 && +q <= 114) {
    const s = surahMeta(+q);
    hits.push({ href: `/surah/${s.n}`, title: `${bnNum(s.n)}. ${s.bn}`, sub: `${s.en} · ${bnNum(s.count)} আয়াত` });
  }
  const f = fold(q);
  for (const [name, [s, k]] of Object.entries(ALIASES)) {
    if (fold(name).startsWith(f) && f.length > 2) hits.push({ href: `/surah/${s}#a-${k}`, title: name.startsWith("আ") ? name : "Ayatul Kursi", sub: `${surahMeta(s).bn} ${bnNum(s)}:${bnNum(k)}` });
  }
  if (f.length > 1 && !/^\d+$/.test(f)) {
    for (const s of surahs) {
      const hay = [s.en, s.meaning, s.bn, s.ar].map(fold).join(" ");
      if (hay.includes(f) || fold(s.en).replace(/ /g, "").includes(f.replace(/ /g, ""))) {
        hits.push({ href: `/surah/${s.n}`, title: `${bnNum(s.n)}. ${s.bn}`, sub: `${s.en} · ${s.meaning}` });
      }
    }
  }
  const seen = new Set<string>();
  return hits.filter((h) => !seen.has(h.href) && seen.add(h.href)).slice(0, 6);
}

export default function JumpField() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const hits = useMemo(() => search(q), [q]);
  const listId = useId();

  return (
    <form
      className="jump"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const h = hits[active] ?? hits[0];
        if (h) router.push(h.href);
      }}
    >
      <label htmlFor="jump-q">যেকোনো জায়গায় যান</label>
      <div className="jump-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          id="jump-q"
          type="search"
          value={q}
          autoComplete="off"
          placeholder="২:২৫৫, কাহফ, পারা ৩০, পৃষ্ঠা ৪২"
          role="combobox"
          aria-expanded={hits.length > 0}
          aria-controls={listId}
          aria-activedescendant={hits.length ? `${listId}-${active}` : undefined}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, hits.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            }
          }}
        />
      </div>
      {q && (
        <ul id={listId} className="jump-hits" role="listbox">
          {hits.length === 0 && <li className="jump-empty">কিছু পাওয়া যায়নি। সূরার নাম, ২:২৫৫, পারা বা পৃষ্ঠা নম্বর লিখে দেখুন।</li>}
          {hits.map((h, i) => (
            <li key={h.href} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <a href={h.href} onClick={(e) => { e.preventDefault(); router.push(h.href); }} onMouseEnter={() => setActive(i)}>
                <b>{h.title}</b>
                <small>{h.sub}</small>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
