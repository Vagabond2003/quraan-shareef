import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Mosaic from "@/components/Mosaic";
import SurahReader from "@/components/SurahReader";
import AyahMarker from "@/components/AyahMarker";
import { getSurahAyahs, index } from "@/lib/quran";
import { bnNum } from "@/lib/num";

export function generateStaticParams() {
  return index.surahs.map((s) => ({ n: String(s.n) }));
}

export async function generateMetadata({ params }: { params: Promise<{ n: string }> }): Promise<Metadata> {
  const { n } = await params;
  const s = index.surahs[+n - 1];
  if (!s) return {};
  return {
    title: `সূরা ${s.bn} (${s.en})`,
    description: `সূরা ${s.bn}, ${s.type === "meccan" ? "মক্কী" : "মাদানী"}, ${bnNum(s.count)} আয়াত। আরবি পাঠ, অনুবাদ ও তিলাওয়াত।`,
    alternates: { canonical: `/surah/${s.n}` },
  };
}

export default function SurahPage({ params }: { params: Promise<{ n: string }> }) {
  return (
    <Suspense fallback={<ReaderFallback />}>
      <Surah params={params} />
    </Suspense>
  );
}

function ReaderFallback() {
  return (
    <div className="reader wrap" aria-busy="true">
      <div className="opener opener-lg" />
      <p className="route-wait">সূরা লোড হচ্ছে…</p>
    </div>
  );
}

async function Surah({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const num = Number(n);
  const s = index.surahs[num - 1];
  if (!s) notFound();
  const ayahs = getSurahAyahs(num);
  const prev = index.surahs[num - 2];
  const next = index.surahs[num];

  return (
    <article className="reader wrap" aria-labelledby="surah-title">
      <header className="surah-head">
        <div className="opener opener-lg">
          <Mosaic seed={num * 7 + 3} cell={18} />
          <div className="opener-tile">
            <p className="ar" lang="ar">
              {s.ar}
            </p>
          </div>
        </div>
        <div className="surah-title-row">
          <div>
            <h1 id="surah-title">
              {bnNum(s.n)}. সূরা {s.bn}
            </h1>
            <p className="surah-sub">
              <span lang="en">
                {s.en} · {s.meaning}
              </span>{" "}
              · {s.type === "meccan" ? "মক্কায় অবতীর্ণ" : "মদিনায় অবতীর্ণ"} · {bnNum(s.count)} আয়াত
            </p>
          </div>
          <Link className="btn btn-s" href={`/mushaf/${s.page}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 6c-2.5-2-6-2-9-1v14c3-1 6.5-1 9 1 2.5-2 6-2 9-1V5c-3-1-6.5-1-9 1Z" />
              <path d="M12 6v14" />
            </svg>
            মুসহাফে পড়ুন · পৃষ্ঠা {bnNum(s.page)}
          </Link>
        </div>
      </header>

      {num !== 1 && num !== 9 && (
        <p className="bismillah ar" lang="ar">
          {index.bismillah}
        </p>
      )}

      <SurahReader s={num} count={s.count} firstGlobal={ayahs[0].g} name={s.bn}>
        {ayahs.map((a) => (
          <article key={a.k} id={`a-${a.k}`} className="ayah" data-k={a.k} data-page={a.page}>
            <div className="ayah-meta">
              <a href={`#a-${a.k}`} className="ayah-ref" lang="en">
                {num}:{a.k}
              </a>
              {a.sajda && <span className="sajda">সিজদা</span>}
              <span className="ayah-acts">
                <button type="button" data-act="explain" className="act act-explain">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 1 4 17.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 0 1.5-1.5z" /><path d="M7 8h1.5M7 11h1.5M15.5 8H17M15.5 11H17" /></svg>
                  <span className="act-label">ব্যাখ্যা</span>
                  <span className="visually-hidden"> আয়াত {bnNum(a.k)}</span>
                </button>
                <button type="button" data-act="play" className="act">
                  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
                  <span className="visually-hidden">আয়াত {bnNum(a.k)} শুনুন</span>
                </button>
                <button type="button" data-act="mark" className="act" aria-pressed="false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M7 3.5h10v17l-5-3.6-5 3.6z" /></svg>
                  <span className="visually-hidden">আয়াত {bnNum(a.k)}-এ ফিতা দিন</span>
                </button>
                <button type="button" data-act="copy" className="act">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8" /></svg>
                  <span className="visually-hidden">আয়াত {bnNum(a.k)} কপি করুন</span>
                </button>
              </span>
            </div>
            <p className="ayah-ar ar" lang="ar" dir="rtl">
              {a.ar}&nbsp;<AyahMarker n={a.k} />
            </p>
            {a.bn?.map((text, i) => (
              <p key={i} className="ayah-bn" data-ed={i} lang="bn">
                {text}
              </p>
            ))}
            {a.en.map((text, i) => (
              <p key={i} className="ayah-en" data-ed={i} lang="en">
                {text}
              </p>
            ))}
          </article>
        ))}
      </SurahReader>

      <nav className="surah-pager" aria-label="অন্য সূরা">
        {prev ? (
          <Link href={`/surah/${prev.n}`} className="btn btn-s">
            ← {bnNum(prev.n)}. {prev.bn}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/surah/${next.n}`} className="btn btn-p">
            {bnNum(next.n)}. {next.bn} →
          </Link>
        )}
      </nav>
    </article>
  );
}
