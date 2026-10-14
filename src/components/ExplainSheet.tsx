"use client";
import { useEffect, useRef, useState } from "react";
import { getTafsir, prefetchTafsir, TAFSIR, type ExplainDepth, type ExplainLang } from "@/lib/tafsir";
import { saveSettings, getSettings } from "@/lib/store";
import { bnNum } from "@/lib/num";

type Props = {
  s: number;
  k: number | null;
  count: number;
  name: string;
  /** Arabic text of the ayah, read from the page. */
  arabic: (k: number) => string;
  onNavigate: (k: number) => void;
  onClose: () => void;
};

type Result = { key: string; text: string | null };

/**
 * Explains one ayah from recognised tafsir: a short plain-language explanation
 * (Al-Mukhtasar) first, with a fuller tafsir one tap away. Always shows its source.
 */
export default function ExplainSheet({ s, k, count, name, arabic, onNavigate, onClose }: Props) {
  const dlg = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<ExplainLang>(() => getSettings().explainLang);
  const [depth, setDepth] = useState<ExplainDepth>("plain");
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const src = TAFSIR[depth][lang];
  const key = `${src.slug}/${s}/${k}/${attempt}`;
  // Anything not yet answered for the current key is still loading; a null text is a failed fetch.
  const state =
    result?.key !== key
      ? ({ status: "loading" } as const)
      : result.text == null
        ? ({ status: "error" } as const)
        : ({ status: "ready", text: result.text } as const);

  useEffect(() => {
    const d = dlg.current;
    if (!d) return;
    if (k != null && !d.open) d.showModal();
    if (k == null && d.open) d.close();
  }, [k]);

  useEffect(() => {
    if (k == null) return;
    let live = true;
    getTafsir(src, s, k)
      .then((text) => {
        if (live) setResult({ key, text });
        // Make the next tap instant: neighbouring ayahs, and the other depth for this one.
        prefetchTafsir(src, s, [k + 1, k + 2, k - 1].filter((n) => n >= 1 && n <= count));
        prefetchTafsir(TAFSIR[depth === "plain" ? "detail" : "plain"][lang], s, [k]);
      })
      .catch(() => live && setResult({ key, text: null }));
    body.current?.scrollTo({ top: 0 });
    return () => {
      live = false;
    };
  }, [src, s, k, key, count, depth, lang]);

  const chooseLang = (l: ExplainLang) => {
    setLang(l);
    saveSettings({ explainLang: l });
  };

  const ref = k != null ? `${bnNum(s)}:${bnNum(k)}` : "";

  return (
    <dialog
      ref={dlg}
      className="explain"
      aria-labelledby="explain-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === dlg.current) dlg.current?.close();
      }}
    >
      {k != null && (
        <div className="explain-in">
          <header className="explain-head">
            <h2 id="explain-title">
              {name} {ref}-এর ব্যাখ্যা
            </h2>
            <button type="button" className="icon-btn" onClick={() => dlg.current?.close()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
              <span className="visually-hidden">বন্ধ করুন</span>
            </button>
          </header>

          <p className="explain-ar ar" lang="ar" dir="rtl">
            {arabic(k)}
          </p>

          <div className="explain-controls">
            <div className="tabs" role="tablist" aria-label="ব্যাখ্যার ধরন">
              {(["plain", "detail"] as const).map((d) => (
                <button key={d} type="button" role="tab" aria-selected={depth === d} className="tab" onClick={() => setDepth(d)}>
                  {d === "plain" ? "সহজ ব্যাখ্যা" : "বিস্তারিত তাফসীর"}
                </button>
              ))}
            </div>
            <div className="lang-switch" role="group" aria-label="ভাষা">
              {(["bn", "en"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={lang === l} onClick={() => chooseLang(l)} lang={l}>
                  {l === "bn" ? "বাংলা" : "English"}
                </button>
              ))}
            </div>
          </div>

          <div ref={body} className="explain-body" role="tabpanel" aria-live="polite" aria-busy={state.status === "loading"}>
            {state.status === "loading" && (
              <div className="explain-wait">
                <span className="brand-star" aria-hidden="true" />
                <span>ব্যাখ্যা লোড হচ্ছে…</span>
              </div>
            )}
            {state.status === "error" && (
              <div className="explain-msg">
                <p>ব্যাখ্যা আনা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন।</p>
                <button type="button" className="btn btn-s" onClick={() => setAttempt((a) => a + 1)}>
                  আবার চেষ্টা করুন
                </button>
              </div>
            )}
            {state.status === "ready" &&
              (state.text ? (
                <div className="explain-text" lang={lang}>
                  {state.text.split(/\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              ) : (
                <div className="explain-msg">
                  <p>এই উৎসে আয়াতটির আলাদা ব্যাখ্যা নেই; সাধারণত আশেপাশের আয়াতের সাথে একসাথে আলোচনা করা হয়েছে।</p>
                  {k > 1 && (
                    <button type="button" className="btn btn-s" onClick={() => onNavigate(k - 1)}>
                      আগের আয়াতের ব্যাখ্যা দেখুন
                    </button>
                  )}
                </div>
              ))}
          </div>

          <footer className="explain-foot">
            <p className="explain-src">
              উৎস:{" "}
              <a href={src.url} target="_blank" rel="noopener noreferrer">
                {src.name}
              </a>{" "}
              <span lang="en">· {src.by}</span>
            </p>
            <p className="explain-note">এটি আক্ষরিক অনুবাদ নয়, আলেমদের লেখা তাফসীর। গুরুত্বপূর্ণ বিষয়ে একজন যোগ্য আলেমের পরামর্শ নিন।</p>
            <nav className="explain-nav" aria-label="অন্য আয়াতের ব্যাখ্যা">
              <button type="button" className="btn btn-g" disabled={k <= 1} onClick={() => onNavigate(k - 1)}>
                ← আগের আয়াত
              </button>
              <button type="button" className="btn btn-g" disabled={k >= count} onClick={() => onNavigate(k + 1)}>
                পরের আয়াত →
              </button>
            </nav>
          </footer>
        </div>
      )}
    </dialog>
  );
}
