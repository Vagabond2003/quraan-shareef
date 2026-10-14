"use client";
import { useSyncExternalStore } from "react";
import type { ArabicScript } from "./types";

export type LastRead = { s: number; k: number; page: number; mode: "surah" | "mushaf"; at: number };
export type Bookmark = { s: number; k: number; at: number };
/** Recitation tracks, always played in this order: Arabic, then Bengali, then English. */
export type Track = "ar" | "bn" | "en";
export const TRACK_ORDER: Track[] = ["ar", "bn", "en"];

export type Settings = {
  theme: "auto" | "light" | "dark" | "system";
  city: string;
  /** Arabic script style: Tanzil Uthmani or Tanzil Simple. */
  script: ArabicScript;
  arScale: number;
  trScale: number;
  showEn: boolean;
  showBn: boolean;
  /** Index into QuranIndex.bnEditions. */
  bnEd: number;
  /** Index into QuranIndex.enEditions. */
  enEd: number;
  /** Which recitation tracks play for each ayah. Never empty. */
  audio: Track[];
  /** Language of the ayah explanation panel. */
  explainLang: "bn" | "en";
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "auto",
  city: "",
  script: "uthmani",
  arScale: 1,
  trScale: 1,
  showEn: true,
  showBn: true,
  bnEd: 0,
  enEd: 0,
  audio: ["ar"],
  explainLang: "bn",
};

const EVENT = "qs-store";
const cache = new Map<string, { raw: string | null; value: unknown }>();

function read<T>(key: string, fallback: T): T {
  let rawValue: string | null = null;
  try {
    rawValue = localStorage.getItem(key);
  } catch {}
  const hit = cache.get(key);
  if (hit && hit.raw === rawValue) return hit.value as T;
  let value: T = fallback;
  if (rawValue) {
    try {
      value = JSON.parse(rawValue);
    } catch {}
  }
  cache.set(key, { raw: rawValue, value });
  return value;
}

export function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function useStored<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
}

export const KEYS = { last: "qs-last", marks: "qs-bookmarks", settings: "qs-settings" } as const;

export const getLast = () => read<LastRead | null>(KEYS.last, null);
export const setLast = (v: Omit<LastRead, "at">) => write(KEYS.last, { ...v, at: Date.now() });

export const getMarks = () => read<Bookmark[]>(KEYS.marks, []);
export function toggleMark(s: number, k: number) {
  const marks = getMarks();
  const has = marks.some((m) => m.s === s && m.k === k);
  write(KEYS.marks, has ? marks.filter((m) => !(m.s === s && m.k === k)) : [{ s, k, at: Date.now() }, ...marks]);
  return !has;
}

export const getSettings = () => ({ ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) });
export function saveSettings(patch: Partial<Settings>) {
  write(KEYS.settings, { ...getSettings(), ...patch });
  (window as unknown as { __qsApply?: () => void }).__qsApply?.();
}
