"use client";
import { useEffect, useRef, useState } from "react";
import { DEFAULT_SETTINGS, KEYS, TRACK_ORDER, getSettings, saveSettings, setLast, toggleMark, useStored, type Bookmark, type Settings, type Track } from "@/lib/store";
import { RECORDED, Recitation } from "@/lib/recitation";
import { quranIndex } from "@/lib/meta";
import ExplainSheet from "./ExplainSheet";
import { bnNum } from "@/lib/num";
import { BASE } from "@/lib/base";

type Props = { s: number; count: number; firstGlobal: number; name: string; children: React.ReactNode };

const SPEEDS = [1, 1.25, 1.5, 0.75];
const REPEATS = [1, 3, 5, 10];
const EMPTY: Bookmark[] = [];
const TRACK_LABEL: Record<Track, string> = { ar: "আরবি", bn: "বাংলা", en: "English" };

/**
 * Behaviour for a server-rendered list of ayahs: recitation in the chosen languages
 * with the part being read highlighted, bookmarks (the ribbon), copy, and saving the reading position.
 */
export default function SurahReader({ s, count, firstGlobal, name, children }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const engine = useRef<Recitation | null>(null);
  const bnVoice = useRef<SpeechSynthesisVoice | null>(null);
  const enVoice = useRef<SpeechSynthesisVoice | null>(null);
  const [hasBnVoice, setHasBnVoice] = useState(false);
  const [hasEnVoice, setHasEnVoice] = useState(false);
  const [cur, setCur] = useState<number | null>(null);
  const [part, setPart] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [repeat, setRepeat] = useState(1);
  const [toast, setToast] = useState<string | null>(null);
  const [explainK, setExplainK] = useState<number | null>(null);
  const marks = useStored<Bookmark[]>(KEYS.marks, EMPTY);
  const stored = useStored<Partial<Settings>>(KEYS.settings, {});
  const selected = stored.audio?.length ? stored.audio : DEFAULT_SETTINGS.audio;

  const st = { ...DEFAULT_SETTINGS, ...stored };
  const enEdition = quranIndex.enEditions[st.enEd] ?? quranIndex.enEditions[0];
  // English plays the recording only for the translation it actually reads; any other English text uses the device voice.
  const enRecorded = enEdition?.id === "en.sahih";
  const bnAvailable = quranIndex.hasBengali && hasBnVoice;
  const enAvailable = enRecorded || hasEnVoice;
  const el = (k: number) => box.current?.querySelector<HTMLElement>(`#a-${k}`) ?? null;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  // Find Bengali and English voices on this device for reading translations aloud.
  useEffect(() => {
    if (typeof speechSynthesis === "undefined") return;
    const pick = () => {
      const all = speechSynthesis.getVoices();
      const bn = all.filter((v) => v.lang.toLowerCase().startsWith("bn"));
      const en = all.filter((v) => v.lang.toLowerCase().startsWith("en"));
      bnVoice.current = bn.find((v) => /bd/i.test(v.lang)) ?? bn[0] ?? null;
      enVoice.current = en.find((v) => v.default) ?? en.find((v) => /gb|us/i.test(v.lang)) ?? en[0] ?? null;
      setHasBnVoice(Boolean(bnVoice.current));
      setHasEnVoice(Boolean(enVoice.current));
    };
    pick();
    speechSynthesis.addEventListener("voiceschanged", pick);
    return () => speechSynthesis.removeEventListener("voiceschanged", pick);
  }, []);

  useEffect(() => {
    const r = new Recitation({
      count,
      firstGlobal,
      tracks: () => {
        const want = getSettings().audio;
        const can = TRACK_ORDER.filter(
          (t) =>
            want.includes(t) &&
            (t === "ar" || (t === "bn" ? quranIndex.hasBengali && bnVoice.current : enIsRecorded() || enVoice.current)),
        );
        return can.length ? can : ["ar"];
      },
      recorded: (t) => t === "ar" || (t === "en" && enIsRecorded()),
      text: (t, k) => el(k)?.querySelector(textSelector(t))?.textContent ?? null,
      voice: (t) => (t === "bn" ? bnVoice.current : t === "en" ? enVoice.current : null),
      onAyah: setCur,
      onPart: setPart,
      onPlaying: setPlaying,
      onError: flash,
      onFinish: () => flash("সূরা শেষ হয়েছে"),
    });
    engine.current = r;
    return () => r.stop();
  }, [count, firstGlobal]);

  // The recited ayah brightens and is kept in view; the part being read is marked.
  useEffect(() => {
    box.current?.querySelectorAll(".ayah.playing").forEach((n) => n.classList.remove("playing"));
    if (cur == null) return;
    const n = el(cur);
    n?.classList.add("playing");
    n?.scrollIntoView({ block: "center", behavior: reduce() ? "auto" : "smooth" });
  }, [cur]);

  useEffect(() => {
    box.current?.querySelectorAll(".speaking").forEach((n) => n.classList.remove("speaking"));
    if (cur == null || !part) return;
    el(cur)?.querySelector(textSelector(part))?.classList.add("speaking");
  }, [cur, part]);

  // Ribbons follow the stored bookmarks.
  useEffect(() => {
    const set = new Set(marks.filter((m) => m.s === s).map((m) => m.k));
    box.current?.querySelectorAll<HTMLElement>(".ayah").forEach((n) => {
      const on = set.has(Number(n.dataset.k));
      n.classList.toggle("marked", on);
      n.querySelector('[data-act="mark"]')?.setAttribute("aria-pressed", String(on));
    });
  }, [marks, s]);

  // Remember the top-most ayah in view as the reading position.
  useEffect(() => {
    const root = box.current;
    if (!root) return;
    let t: number | undefined;
    const visible = new Map<number, number>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const k = Number((e.target as HTMLElement).dataset.k);
          if (e.isIntersecting) visible.set(k, Number((e.target as HTMLElement).dataset.page));
          else visible.delete(k);
        }
        window.clearTimeout(t);
        t = window.setTimeout(() => {
          if (!visible.size) return;
          const k = Math.min(...visible.keys());
          setLast({ s, k, page: visible.get(k)!, mode: "surah" });
        }, 700);
      },
      { rootMargin: "-20% 0px -55% 0px" },
    );
    root.querySelectorAll(".ayah").forEach((n) => io.observe(n));
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [s]);

  // Arriving from a link like /surah/2#a-255: glow that ayah briefly.
  useEffect(() => {
    const k = Number(location.hash.replace("#a-", ""));
    if (!k) return;
    const n = el(k);
    if (!n) return;
    n.scrollIntoView({ block: "center" });
    n.classList.add("arrive");
    const t = window.setTimeout(() => n.classList.remove("arrive"), 2200);
    return () => window.clearTimeout(t);
  }, []);

  const playAyah = (k: number) => engine.current?.play(k);

  const toggle = () => {
    const r = engine.current;
    if (!r) return;
    if (!r.current) return r.play(1);
    if (playing) r.pause();
    else r.resume();
  };

  const setTracks = (t: Track) => {
    const next = selected.includes(t) ? selected.filter((x) => x !== t) : [...selected, t];
    if (!next.length) return flash("অন্তত একটি ভাষা বেছে নিন");
    saveSettings({ audio: TRACK_ORDER.filter((x) => next.includes(x)) });
    if (engine.current?.current) flash("পরের আয়াত থেকে নতুন ভাষায় শোনা যাবে");
  };

  const onClick = (e: React.MouseEvent) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>("[data-act]");
    const ayah = btn?.closest<HTMLElement>(".ayah");
    if (!btn || !ayah) return;
    const k = Number(ayah.dataset.k);
    const act = btn.dataset.act;
    if (act === "explain") {
      setExplainK(k);
    } else if (act === "play") {
      if (cur === k && playing) engine.current?.pause();
      else playAyah(k);
    } else if (act === "mark") {
      flash(toggleMark(s, k) ? `আয়াত ${bnNum(k)}-এ ফিতা দেওয়া হয়েছে` : "ফিতা সরানো হয়েছে");
    } else if (act === "copy") {
      const ar = arabicOf(ayah);
      const st = getSettings();
      const tr = [
        st.showBn ? ayah.querySelector(`.ayah-bn[data-ed="${st.bnEd}"]`)?.textContent : null,
        st.showEn ? ayah.querySelector(`.ayah-en[data-ed="${st.enEd}"]`)?.textContent : null,
      ]
        .filter(Boolean)
        .join("\n");
      const text = `${ar}\n\n${tr}\n\n${name} ${s}:${k} · ${location.origin}${BASE}/surah/${s}/#a-${k}`;
      navigator.clipboard
        .writeText(text)
        .then(() => flash("কপি হয়েছে"))
        .catch(() => flash("কপি করা যায়নি"));
    }
  };

  const playable = selected.filter((t) => (t === "bn" ? bnAvailable : t === "en" ? enAvailable : true));
  const shortLabel = playable.length === 3 ? "সব ভাষা" : playable.map((t) => TRACK_LABEL[t]).join(" + ") || "আরবি";
  const voiceLine =
    part === "bn"
      ? `বাংলা · ডিভাইসের কণ্ঠ`
      : part === "en"
        ? enRecorded
          ? `${RECORDED.en!.voice} · ${RECORDED.en!.note}`
          : `English · device voice · ${enEdition?.englishName}`
        : RECORDED.ar!.voice;
  const translator = quranIndex.bnEditions[st.bnEd]?.name;

  return (
    <>
      <div ref={box} className="ayahs" onClick={onClick}>
        {children}
      </div>

      <div className="player" role="region" aria-label="তিলাওয়াত">
        <div className="player-in">
          <button type="button" className="pl-btn" onClick={() => cur && cur > 1 && playAyah(cur - 1)} disabled={!cur || cur <= 1}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18 6v12l-8.5-6zM6 6h2v12H6z" /></svg>
            <span className="visually-hidden">আগের আয়াত</span>
          </button>
          <button type="button" className="pl-main" onClick={toggle}>
            {playing ? (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1" /><rect x="13.5" y="5" width="4" height="14" rx="1" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" /></svg>
            )}
            <span className="visually-hidden">{playing ? "থামান" : "শুনুন"}</span>
          </button>
          <button type="button" className="pl-btn" onClick={() => playAyah(cur ? Math.min(cur + 1, count) : 1)} disabled={cur === count}>
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 6v12l8.5-6zM16 6h2v12h-2z" /></svg>
            <span className="visually-hidden">পরের আয়াত</span>
          </button>
          <div className="pl-who">
            <b>{cur ? `${name} · আয়াত ${bnNum(cur)} / ${bnNum(count)}` : `${name} শুনুন`}</b>
            <span lang={part === "bn" ? "bn" : "en"}>{cur ? voiceLine : shortLabel}</span>
          </div>
          <button type="button" className="pill pill-lang" popoverTarget="audio-langs" aria-label={`শোনার ভাষা: ${shortLabel}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9v6h3l5 4V5L7 9H4z" />
              <path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />
            </svg>
            <span className="pill-lang-text">{shortLabel}</span>
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => {
              const v = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
              setSpeed(v);
              engine.current?.setSpeed(v);
            }}
          >
            <span className="visually-hidden">গতি </span>
            {bnNum(speed)}×
          </button>
          <button
            type="button"
            className="pill"
            onClick={() => {
              const v = REPEATS[(REPEATS.indexOf(repeat) + 1) % REPEATS.length];
              setRepeat(v);
              if (engine.current) engine.current.repeat = v;
            }}
          >
            {repeat === 1 ? "একবার" : `${bnNum(repeat)} বার`}
          </button>
        </div>
      </div>

      <div id="audio-langs" popover="auto" className="lang-pop" aria-labelledby="audio-langs-title">
        <h2 id="audio-langs-title">কোন ভাষায় শুনবেন</h2>
        <p className="lang-hint">একাধিক বেছে নিলে প্রতিটি আয়াত আরবি, তারপর বাংলা, তারপর ইংরেজিতে শোনাবে।</p>
        <ul>
          <li>
            <label className="lang-opt">
              <input type="checkbox" id="trk-ar" checked={selected.includes("ar")} onChange={() => setTracks("ar")} />
              <span>
                <b>আরবি তিলাওয়াত</b>
                <small lang="en">{RECORDED.ar!.voice}</small>
              </span>
            </label>
          </li>
          <li>
            <label className="lang-opt">
              <input type="checkbox" id="trk-bn" checked={selected.includes("bn") && bnAvailable} disabled={!bnAvailable} onChange={() => setTracks("bn")} />
              <span>
                <b>বাংলা অনুবাদ</b>
                <small>
                  {!quranIndex.hasBengali
                    ? "কোনো বাংলা অনুবাদ যুক্ত করা নেই"
                    : hasBnVoice
                      ? `ডিভাইসের বাংলা কণ্ঠে পড়বে${translator ? ` · ${translator}` : ""}`
                      : "এই ডিভাইসে বাংলা কণ্ঠ নেই। ফোন বা কম্পিউটারের সেটিংসে বাংলা টেক্সট-টু-স্পিচ যোগ করলে চালু হবে।"}
                </small>
              </span>
            </label>
          </li>
          <li>
            <label className="lang-opt">
              <input type="checkbox" id="trk-en" checked={selected.includes("en") && enAvailable} disabled={!enAvailable} onChange={() => setTracks("en")} />
              <span>
                <b>English translation</b>
                <small lang="en">
                  {enRecorded
                    ? `${RECORDED.en!.voice}, reading the ${RECORDED.en!.note} text shown on screen.`
                    : hasEnVoice
                      ? `This device's English voice reads the ${enEdition?.englishName} text on screen. Choose Saheeh International in settings for a recorded voice.`
                      : `No English voice on this device. Choose Saheeh International in settings for a recorded voice.`}
                </small>
              </span>
            </label>
          </li>
        </ul>
      </div>

      <ExplainSheet
        s={s}
        k={explainK}
        count={count}
        name={name}
        arabic={(k) => arabicOf(el(k))}
        onNavigate={(k) => {
          setExplainK(k);
          el(k)?.scrollIntoView({ block: "center", behavior: reduce() ? "auto" : "smooth" });
        }}
        onClose={() => setExplainK(null)}
      />

      <p className="toast" role="status" aria-live="polite" data-show={toast ? "" : undefined}>
        {toast}
      </p>
    </>
  );
}

/** The ayah's Arabic in the reader's chosen script, without the ayah number. */
const arabicOf = (ayah: Element | null | undefined) =>
  ayah?.querySelector(`.ayah-ar ${getSettings().script === "simple" ? ".ar-s" : ".ar-u"}`)?.textContent?.trim() ?? "";

const enIsRecorded = () => quranIndex.enEditions[getSettings().enEd]?.id === "en.sahih";

/** The on-screen element holding a track's text, for the chosen translator. */
const textSelector = (t: Track) =>
  t === "ar" ? ".ayah-ar" : t === "bn" ? `.ayah-bn[data-ed="${getSettings().bnEd}"]` : `.ayah-en[data-ed="${getSettings().enEd}"]`;
