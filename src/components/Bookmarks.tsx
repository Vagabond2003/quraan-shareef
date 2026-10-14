"use client";
import Link from "next/link";
import { KEYS, toggleMark, useStored, type Bookmark } from "@/lib/store";
import { surahMeta } from "@/lib/meta";
import { bnNum } from "@/lib/num";

const EMPTY: Bookmark[] = [];

export default function Bookmarks() {
  const marks = useStored<Bookmark[]>(KEYS.marks, EMPTY);
  if (!marks.length) return null;
  return (
    <section className="marks" aria-labelledby="marks-title">
      <h2 id="marks-title">ফিতা দেওয়া আয়াত</h2>
      <ul>
        {marks.map((m) => (
          <li key={`${m.s}:${m.k}`}>
            <Link href={`/surah/${m.s}#a-${m.k}`}>
              <span className="ribbon" aria-hidden="true" />
              <b>{surahMeta(m.s).bn}</b>
              <span>
                {bnNum(m.s)}:{bnNum(m.k)}
              </span>
            </Link>
            <button type="button" className="icon-btn" onClick={() => toggleMark(m.s, m.k)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M7 7l10 10M17 7 7 17" />
              </svg>
              <span className="visually-hidden">
                {surahMeta(m.s).bn} {bnNum(m.k)} থেকে ফিতা সরান
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
