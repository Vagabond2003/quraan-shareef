"use client";
import Link from "next/link";
import { KEYS, useStored, type LastRead } from "@/lib/store";
import { juzOfPage, surahMeta } from "@/lib/meta";
import { bnNum } from "@/lib/num";

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function ContinueCard() {
  const last = useStored<LastRead | null>(KEYS.last, null);

  if (!last) {
    return (
      <Link href="/surah/1" className="continue">
        <b>আল-ফাতিহা</b>
        <span className="continue-meta">সূরা ১ · পৃষ্ঠা ১ · যেখানে থামবেন, পরের বার এখানে ফিতা থাকবে</span>
        <span className="continue-go">
          শুরু করুন <Arrow />
        </span>
        <span className="ribbon" aria-hidden="true" />
      </Link>
    );
  }

  const s = surahMeta(last.s);
  const href = last.mode === "mushaf" ? `/mushaf/${last.page}` : `/surah/${last.s}#a-${last.k}`;
  return (
    <Link href={href} className="continue">
      <b>
        {s.bn} · আয়াত {bnNum(last.k)}
      </b>
      <span className="continue-meta">
        পৃষ্ঠা {bnNum(last.page)} · পারা {bnNum(juzOfPage(last.page))} · {last.mode === "mushaf" ? "মুসহাফ" : "অনুবাদসহ"}
      </span>
      <span className="continue-go">
        পড়া চালিয়ে যান <Arrow />
      </span>
      <span className="ribbon" aria-hidden="true" />
    </Link>
  );
}
