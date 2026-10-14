"use client";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import MushafPage from "./MushafPage";
import { PAGE_COUNT, juzOfPage, surahMeta } from "@/lib/meta";
import { bnNum, latinDigits } from "@/lib/num";
import { setLast } from "@/lib/store";
import type { PageData } from "@/lib/types";
import { BASE } from "@/lib/base";

type Turn = { dir: 1 | -1; front: number; back: number | null; target: number; drag: boolean };

const SPREAD_QUERY = "(min-width: 900px) and (min-aspect-ratio: 1/1)";
const subscribeMQ = (cb: () => void) => {
  const mq = matchMedia(SPREAD_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const TURN_MS = 900;

/**
 * Right-to-left mushaf. Pages turn from left to right, hinged at the spine,
 * bending along one crease (the --bend shadow). Two pages on wide screens, one on phones.
 */
export default function MushafBook({ initialPage, seed }: { initialPage: number; seed: PageData[] }) {
  const [pages, setPages] = useState(() => new Map(seed.map((d) => [d.p, d])));
  const requested = useRef(new Set(seed.map((d) => d.p)));
  const spread = useSyncExternalStore(subscribeMQ, () => matchMedia(SPREAD_QUERY).matches, () => true);
  const [page, setPage] = useState(initialPage);
  const [turn, setTurn] = useState<Turn | null>(null);
  const leaf = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dir: 1 | -1; x: number; moved: boolean; angle: number; id: number } | null>(null);
  const busy = useRef(false);

  const right = spread ? (page % 2 ? page : page - 1) : page;
  const canFwd = spread ? right + 2 <= PAGE_COUNT : page < PAGE_COUNT;
  const canBack = spread ? right >= 3 : page > 1;

  const load = useCallback(async (p: number) => {
    if (p < 1 || p > PAGE_COUNT || requested.current.has(p)) return;
    requested.current.add(p);
    try {
      const res = await fetch(`${BASE}/data/page/${p}.json`);
      if (!res.ok) throw new Error(String(res.status));
      const data: PageData = await res.json();
      setPages((prev) => new Map(prev).set(p, data));
    } catch {
      requested.current.delete(p);
    }
  }, []);

  // Keep the neighbouring spreads ready so a turn never waits.
  // load() only sets state after its fetch resolves, so this never renders synchronously.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    for (let d = -4; d <= 5; d++) load(right + d);
  }, [right, load]);

  // Save position and keep the URL on the current page without a navigation.
  useEffect(() => {
    const data = pages.get(right);
    window.history.replaceState(window.history.state, "", `${BASE}/mushaf/${right}/`);
    if (data) setLast({ s: data.items[0].s, k: data.items[0].k, page: right, mode: "mushaf" });
  }, [right, pages]);

  const plan = useCallback(
    (dir: 1 | -1, isDrag: boolean): Turn | null => {
      if (dir === 1 && !canFwd) return null;
      if (dir === -1 && !canBack) return null;
      if (spread) {
        return dir === 1
          ? { dir, front: right + 1, back: right + 2, target: right + 2, drag: isDrag }
          : { dir, front: right - 1, back: right, target: right - 2, drag: isDrag };
      }
      return dir === 1
        ? { dir, front: page, back: null, target: page + 1, drag: isDrag }
        : { dir, front: page - 1, back: null, target: page - 1, drag: isDrag };
    },
    [spread, right, page, canFwd, canBack],
  );

  const commit = useCallback((t: Turn) => {
    setPage(t.target);
    setTurn(null);
    busy.current = false;
  }, []);

  const animate = useCallback((angle: number, full: boolean, done: () => void) => {
    const el = leaf.current;
    if (!el || reduced()) return done();
    el.style.transition = `transform ${full ? TURN_MS : 420}ms var(--ease)`;
    if (full) {
      el.classList.remove("turning");
      void el.offsetWidth;
      el.classList.add("turning");
    }
    el.style.removeProperty("--bend");
    el.style.transform = `rotateY(${angle}deg)`;
    let finished = false;
    const end = () => {
      if (finished) return;
      finished = true;
      el.removeEventListener("transitionend", end);
      done();
    };
    el.addEventListener("transitionend", end);
    window.setTimeout(end, (full ? TURN_MS : 420) + 80);
  }, []);

  const go = useCallback(
    (dir: 1 | -1) => {
      if (busy.current) return;
      const t = plan(dir, false);
      if (!t) return;
      busy.current = true;
      Promise.all([load(t.front), t.back ? load(t.back) : null, load(dir === 1 ? (spread ? right + 3 : page + 1) : spread ? right - 2 : page)]).then(() =>
        setTurn(t),
      );
    },
    [plan, load, spread, right, page],
  );

  // Place the leaf at its resting angle, then turn it.
  useLayoutEffect(() => {
    const el = leaf.current;
    if (!turn || !el) return;
    const from = turn.dir === 1 ? 0 : 180;
    el.style.transition = "none";
    el.style.transform = `rotateY(${from}deg)`;
    if (turn.drag) return;
    const id = requestAnimationFrame(() => animate(turn.dir === 1 ? 180 : 0, true, () => commit(turn)));
    return () => cancelAnimationFrame(id);
  }, [turn, animate, commit]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, select, textarea, dialog[open]")) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        go(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (busy.current || e.button !== 0) return;
    const r = bookRef.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const dir: 1 | -1 | 0 = spread ? (x < 0.5 ? 1 : -1) : x < 0.45 ? 1 : x > 0.55 ? -1 : 0;
    if (!dir || (dir === 1 && !canFwd) || (dir === -1 && !canBack)) return;
    drag.current = { dir, x: e.clientX, moved: false, angle: dir === 1 ? 0 : 180, id: e.pointerId };
    bookRef.current!.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (!d.moved) {
      if (Math.abs(dx) < 6 || reduced()) return;
      const t = plan(d.dir, true);
      if (!t || !pages.has(t.front)) return;
      d.moved = true;
      busy.current = true;
      setTurn(t);
      return;
    }
    const el = leaf.current;
    if (!el) return;
    const w = bookRef.current!.clientWidth / (spread ? 2 : 1);
    const k = Math.max(0, Math.min(180, ((dx * d.dir) / (w * 1.3)) * 180));
    d.angle = d.dir === 1 ? k : 180 - k;
    el.style.transform = `rotateY(${d.angle}deg)`;
    el.style.setProperty("--bend", Math.sin((d.angle * Math.PI) / 180).toFixed(3));
  };

  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) return go(d.dir);
    const t = turn;
    if (!t) {
      busy.current = false;
      return;
    }
    const passed = d.dir === 1 ? d.angle > 55 : d.angle < 125;
    if (passed) animate(d.dir === 1 ? 180 : 0, false, () => commit(t));
    else
      animate(d.dir === 1 ? 0 : 180, false, () => {
        setTurn(null);
        busy.current = false;
      });
  };

  const P = (n: number) => <MushafPage n={n} data={pages.get(n)} />;

  // What lies beneath the turning leaf.
  let baseRight: number;
  let baseLeft: number | null = null;
  if (spread) {
    baseRight = turn?.dir === -1 ? right - 2 : right;
    baseLeft = turn?.dir === 1 ? right + 3 : right + 1;
  } else {
    baseRight = turn?.dir === 1 ? page + 1 : page;
  }

  const first = pages.get(right)?.items[0];
  const firstMeta = first ? surahMeta(first.s) : null;
  const label = spread ? `পৃষ্ঠা ${bnNum(right)}–${bnNum(Math.min(right + 1, PAGE_COUNT))}` : `পৃষ্ঠা ${bnNum(page)}`;

  return (
    <div className="mushaf">
      <div
        ref={bookRef}
        className={`book ${spread ? "is-spread" : "is-single"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="region"
        aria-roledescription="মুসহাফ"
        aria-label={`${label}। বাঁ তীর চিহ্নে পরের পৃষ্ঠা, ডান তীর চিহ্নে আগের পৃষ্ঠা।`}
      >
        <div className="slot slot-right">{P(baseRight)}</div>
        {spread && baseLeft !== null && baseLeft <= PAGE_COUNT && <div className="slot slot-left">{P(baseLeft)}</div>}
        {turn && (
          <div className="leaf" ref={leaf}>
            <div className="face front">{P(turn.front)}</div>
            <div className="face back">{turn.back ? P(turn.back) : <div className="mp mp-blank" />}</div>
          </div>
        )}
        {spread && <div className="spine" aria-hidden="true" />}
      </div>

      <div className="mushaf-bar">
        <button type="button" className="btn btn-s" onClick={() => go(1)} disabled={!canFwd}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          <span className="bar-label">পরের পৃষ্ঠা</span>
        </button>
        <div className="mushaf-pos" aria-live="polite">
          <b>{label}</b>
          <span>
            পারা {bnNum(juzOfPage(right))}
            {firstMeta && ` · ${firstMeta.bn}`}
          </span>
        </div>
        <button type="button" className="btn btn-s" onClick={() => go(-1)} disabled={!canBack}>
          <span className="bar-label">আগের পৃষ্ঠা</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </div>

      <div className="mushaf-tools">
        <form
          className="goto"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Number(latinDigits(String(new FormData(e.currentTarget).get("p") ?? "")));
            if (v >= 1 && v <= PAGE_COUNT) {
              setTurn(null);
              busy.current = false;
              setPage(v);
            }
          }}
        >
          <label htmlFor="goto-p">পৃষ্ঠায় যান</label>
          <input id="goto-p" name="p" inputMode="numeric" placeholder={`১–${bnNum(PAGE_COUNT)}`} autoComplete="off" />
          <button type="submit" className="btn btn-g">যান</button>
        </form>
        {first && (
          <Link className="btn btn-g" href={`/surah/${first.s}#a-${first.k}`}>
            এই পৃষ্ঠা অনুবাদসহ পড়ুন
          </Link>
        )}
      </div>
    </div>
  );
}
