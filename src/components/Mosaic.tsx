"use client";
import { useEffect, useRef } from "react";

type Props = { seed: number; cell?: number; stars?: boolean; className?: string };

// Chini-tikri: jittered shards of glazed china set in plaster grout, with eight-pointed tara stars.
// Colours come from the --sh-* tokens, so it redraws for day and night.
export default function Mosaic({ seed, cell = 22, stars = false, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const draw = () => paint(cv, seed, cell, stars);
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", draw);
    return () => {
      ro.disconnect();
      mo.disconnect();
      mq.removeEventListener("change", draw);
    };
  }, [seed, cell, stars]);

  return <canvas ref={ref} className={className ?? "mosaic"} aria-hidden="true" />;
}

function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >> 17;
    s ^= s << 5;
    s >>>= 0;
    return s / 4294967296;
  };
}

function paint(cv: HTMLCanvasElement, seed: number, cell: number, withStars: boolean) {
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  if (!w || !h) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr);
  cv.height = Math.round(h * dpr);
  const ctx = cv.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  const P = {
    grout: v("--grout"), white: v("--sh-white"), pale: v("--sh-pale"), blue: v("--sh-blue"),
    deep: v("--sh-deep"), cel: v("--sh-cel"), rose: v("--sh-rose"),
  };
  const rand = rng(seed);
  ctx.fillStyle = P.grout;
  ctx.fillRect(0, 0, w, h);

  const cols = Math.ceil(w / cell) + 1;
  const rows = Math.ceil(h / cell) + 1;
  const pts: [number, number][][] = [];
  for (let y = 0; y <= rows; y++) {
    pts[y] = [];
    for (let x = 0; x <= cols; x++) pts[y][x] = [x * cell + (rand() - 0.5) * cell * 0.72, y * cell + (rand() - 0.5) * cell * 0.72];
  }
  const pick = () => {
    const r = rand();
    return r < 0.38 ? P.white : r < 0.58 ? P.pale : r < 0.78 ? P.blue : r < 0.88 ? P.deep : r < 0.95 ? P.cel : P.rose;
  };
  const gap = Math.max(0.9, cell * 0.06);

  const shard = (poly: [number, number][]) => {
    let cx = 0;
    let cy = 0;
    for (const p of poly) {
      cx += p[0];
      cy += p[1];
    }
    cx /= poly.length;
    cy /= poly.length;
    ctx.beginPath();
    poly.forEach((p, i) => {
      const dx = p[0] - cx;
      const dy = p[1] - cy;
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.max(0, (d - gap) / d);
      if (i) ctx.lineTo(cx + dx * k, cy + dy * k);
      else ctx.moveTo(cx + dx * k, cy + dy * k);
    });
    ctx.closePath();
    const c = pick();
    ctx.fillStyle = c;
    ctx.fill();
    // A fragment of the painted pattern that was on the plate before it broke.
    if ((c === P.white || c === P.pale) && rand() < 0.4) {
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = P.blue;
      ctx.lineWidth = Math.max(0.6, cell * 0.05);
      ctx.globalAlpha = 0.75;
      const r = cell * (0.25 + rand() * 0.35);
      ctx.beginPath();
      ctx.arc(cx + (rand() - 0.5) * cell * 0.5, cy + (rand() - 0.5) * cell * 0.5, r, rand() * 6, rand() * 6 + 2.4);
      ctx.stroke();
      if (rand() < 0.5) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const a = pts[y][x];
      const b = pts[y][x + 1];
      const c = pts[y + 1][x + 1];
      const d = pts[y + 1][x];
      if (rand() < 0.42) {
        if (rand() < 0.5) {
          shard([a, b, c]);
          shard([a, c, d]);
        } else {
          shard([a, b, d]);
          shard([b, c, d]);
        }
      } else shard([a, b, c, d]);
    }
  }

  if (withStars) {
    const n = Math.max(2, Math.round((w * h) / (cell * cell * 55)));
    for (let i = 0; i < n; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = cell * (0.55 + rand() * 0.35);
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      for (let j = 0; j < 16; j++) {
        const a = (j * Math.PI) / 8 - Math.PI / 2;
        const rr = j % 2 ? r * 0.62 : r;
        ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath();
      ctx.fillStyle = P.deep;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = P.white;
      ctx.fill();
      ctx.restore();
    }
  }
}
