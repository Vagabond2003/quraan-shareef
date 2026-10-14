"use client";
import { Fragment, useLayoutEffect, useRef } from "react";
import Mosaic from "./Mosaic";
import AyahMarker from "./AyahMarker";
import { quranIndex, surahMeta } from "@/lib/meta";
import { arNum } from "@/lib/num";
import type { PageData, PageItem } from "@/lib/types";

type Segment = { type: "open"; s: number } | { type: "text"; items: PageItem[] };

function segments(items: PageItem[]): Segment[] {
  const out: Segment[] = [];
  for (const it of items) {
    if (it.k === 1) out.push({ type: "open", s: it.s });
    const last = out[out.length - 1];
    if (last?.type === "text") last.items.push(it);
    else out.push({ type: "text", items: [it] });
  }
  return out;
}

/** One mushaf page: running head, surah openers, justified Arabic sized to fill the page, folio. */
export default function MushafPage({ n, data }: { n: number; data?: PageData }) {
  const page = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const opening = n <= 2;

  // Shrink the type until the page's text fits its frame, the way a printed mushaf fills each page.
  useLayoutEffect(() => {
    const pg = page.current;
    const b = body.current;
    if (!pg || !b || !data) return;
    const fit = () => {
      const w = pg.clientWidth;
      if (!w) return;
      let size = w * (opening ? 0.068 : 0.056);
      b.style.fontSize = `${size}px`;
      for (let i = 0; i < 30 && b.scrollHeight > b.clientHeight + 1 && size > 6; i++) {
        size *= 0.96;
        b.style.fontSize = `${size}px`;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(pg);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [data, opening]);

  if (!data) {
    return (
      <div className="mp" ref={page}>
        <div className="mp-frame mp-wait">
          <span className="brand-star" aria-hidden="true" />
          <span>পৃষ্ঠা লোড হচ্ছে…</span>
        </div>
      </div>
    );
  }

  const first = surahMeta(data.items[0].s);
  return (
    <div className="mp" ref={page}>
      <div className="mp-frame">
        <div className="mp-run ar" lang="ar">
          <span>{first.ar.replace(/^سُورَةُ\s*/, "")}</span>
          <span>الجزء {arNum(data.juz)}</span>
        </div>
        <div className={`mp-body${opening ? " mp-opening" : ""}`} ref={body} lang="ar" dir="rtl">
          {segments(data.items).map((seg, i) =>
            seg.type === "open" ? (
              <Fragment key={`o${seg.s}`}>
                <div className="opener mp-opener">
                  <Mosaic seed={seg.s * 7 + 3} cell={9} />
                  <div className="opener-tile">
                    <span className="ar">{surahMeta(seg.s).ar}</span>
                  </div>
                </div>
                {seg.s !== 1 && seg.s !== 9 && <p className="mp-bism ar">{quranIndex.bismillah}</p>}
              </Fragment>
            ) : (
              <p className="mp-text ar" key={`t${i}`}>
                {seg.items.map((it, j) => {
                  const prev = j > 0 ? seg.items[j - 1] : null;
                  return (
                    <Fragment key={it.g}>
                      {prev && prev.hizbQ !== it.hizbQ && <span className="hizb" aria-label="হিজবের চতুর্থাংশ">۞ </span>}
                      <span className="mp-ayah" data-s={it.s} data-k={it.k}>
                        {it.ar}&nbsp;<AyahMarker n={it.k} />
                      </span>{" "}
                    </Fragment>
                  );
                })}
              </p>
            ),
          )}
        </div>
      </div>
      <p className="mp-folio ar">{arNum(n)}</p>
    </div>
  );
}
