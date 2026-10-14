"use client";
import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import AyahMarker from "./AyahMarker";
import { BASE } from "@/lib/base";
import { bnNum } from "@/lib/num";
import type { WbwSurah, WbwWord } from "@/lib/types";

const surahs = new Map<number, Promise<WbwSurah>>();
function loadSurah(s: number) {
  let hit = surahs.get(s);
  if (!hit) {
    hit = fetch(`${BASE}/data/wbw/${s}.json`).then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    });
    hit.catch(() => surahs.delete(s));
    surahs.set(s, hit);
  }
  return hit;
}

// One player for word recordings, shared so ayah recitation can silence it.
let wordAudio: HTMLAudioElement | null = null;
/** Stop any word recording, e.g. when ayah recitation starts. */
export function stopWord() {
  wordAudio?.pause();
}

const pad = (n: number) => String(n).padStart(3, "0");

type Props = {
  s: number;
  /** The element holding the server-rendered ayahs, each with an empty .ayah-words placeholder. */
  box: React.RefObject<HTMLDivElement | null>;
  simple: boolean;
  /** Called before a word plays, so ayah recitation can step aside. */
  onWordPlay: () => void;
  onError: (msg: string) => void;
};

/**
 * Word-by-word reading: fills each ayah's placeholder with its words (Arabic, transliteration, meanings),
 * from Quran.com's word data, fetched only when this view is on. Tapping a word plays its recording.
 */
export default function WordByWord({ s, box, simple, onWordPlay, onError }: Props) {
  const [data, setData] = useState<WbwSurah | null>(null);
  const [targets, setTargets] = useState<HTMLElement[]>([]);
  const [sounding, setSounding] = useState<{ k: number; pos: number } | null>(null);
  // The parent passes fresh callbacks each render; refs keep the effects and `play` stable,
  // so its state changes (recitation progress, toasts) never re-render thousands of words.
  const cb = useRef({ onWordPlay, onError });
  useEffect(() => {
    cb.current = { onWordPlay, onError };
  });

  useEffect(() => {
    let live = true;
    loadSurah(s)
      .then((d) => {
        if (!live) return;
        setTargets(Array.from(box.current?.querySelectorAll<HTMLElement>(".ayah-words") ?? []));
        setData(d);
      })
      .catch(() => live && cb.current.onError("শব্দে শব্দে অর্থ আনা যায়নি। ইন্টারনেট সংযোগ দেখুন।"));
    return () => {
      live = false;
    };
  }, [s, box]);

  // Words make every ayah taller, so a link to #a-N lands short once they arrive; scroll there again.
  useLayoutEffect(() => {
    if (!data) return;
    const k = Number(location.hash.replace("#a-", ""));
    const el = k ? box.current?.querySelector<HTMLElement>(`#a-${k}`) : null;
    // A long ayah in words can be taller than the screen: show its beginning rather than its middle.
    el?.scrollIntoView({ block: el.offsetHeight > innerHeight * 0.7 ? "start" : "center" });
  }, [data, box]);

  useEffect(
    () => () => {
      if (wordAudio) {
        wordAudio.pause();
        wordAudio.onended = wordAudio.onerror = null;
      }
    },
    [],
  );

  const play = useCallback(
    (k: number, pos: number) => {
      cb.current.onWordPlay();
      const a = (wordAudio ??= new Audio());
      const done = () => setSounding((cur) => (cur?.k === k && cur.pos === pos ? null : cur));
      a.onended = done;
      a.onerror = () => {
        done();
        cb.current.onError("শব্দটির তিলাওয়াত চালানো যায়নি। ইন্টারনেট সংযোগ দেখুন।");
      };
      a.src = `https://audio.qurancdn.com/wbw/${pad(s)}_${pad(k)}_${pad(pos)}.mp3`;
      setSounding({ k, pos });
      // A quick second tap aborts this play(); only clear the highlight if it still belongs to this word.
      a.play().catch(done);
    },
    [s],
  );

  if (!data) return null;
  return targets.map((t) => {
    const k = Number(t.dataset.k);
    const words = data.ayahs[k - 1];
    if (!words) return null;
    return createPortal(
      <AyahWords k={k} words={words} simple={simple} soundingPos={sounding?.k === k ? sounding.pos : null} onPlay={play} />,
      t,
      String(k),
    );
  });
}

type AyahProps = { k: number; words: WbwWord[]; simple: boolean; soundingPos: number | null; onPlay: (k: number, pos: number) => void };

/** One ayah's words. Memoized: a tap re-renders only the ayah whose highlight changed. */
const AyahWords = memo(function AyahWords({ k, words, simple, soundingPos, onPlay }: AyahProps) {
  // One tab stop per ayah; arrow keys move between its words (left is the next word in Arabic order).
  const onKeyDown = (e: React.KeyboardEvent<HTMLOListElement>) => {
    const step = e.key === "ArrowLeft" ? 1 : e.key === "ArrowRight" ? -1 : e.key === "Home" ? -Infinity : e.key === "End" ? Infinity : 0;
    if (!step) return;
    const btns = Array.from(e.currentTarget.querySelectorAll<HTMLButtonElement>(".word"));
    const i = btns.indexOf(document.activeElement as HTMLButtonElement);
    if (i < 0) return;
    e.preventDefault();
    const next = btns[Math.max(0, Math.min(btns.length - 1, i + step))];
    btns.forEach((b) => (b.tabIndex = b === next ? 0 : -1));
    next.focus();
  };

  return (
    <ol className="words" lang="ar" dir="rtl" aria-label={`আয়াত ${bnNum(k)}-এর শব্দ, শুনতে শব্দে চাপুন`} onKeyDown={onKeyDown}>
      {words.map(([uthmani, simpleText, bn, en, tr], i) => (
        <li key={i}>
          <button
            type="button"
            className={`word${soundingPos === i + 1 ? " sounding" : ""}`}
            tabIndex={i === 0 ? 0 : -1}
            aria-pressed={soundingPos === i + 1}
            onClick={() => onPlay(k, i + 1)}
          >
            <span className="w-ar">{simple ? simpleText : uthmani}</span>
            {tr && (
              <span className="w-tr" lang="en-Latn" dir="ltr">
                {tr}
              </span>
            )}
            <span className="w-bn" lang="bn" dir="ltr">
              {bn}
            </span>
            <span className="w-en" lang="en" dir="ltr">
              {en}
            </span>
          </button>
        </li>
      ))}
      <li className="w-end" aria-hidden="true">
        <AyahMarker n={k} />
      </li>
    </ol>
  );
});
