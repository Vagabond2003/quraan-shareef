"use client";
import { useRef } from "react";
import { quranIndex } from "@/lib/meta";
import { CITIES, cityForTimezone } from "@/lib/theme-script";
import { DEFAULT_SETTINGS, KEYS, saveSettings, useStored, type Settings } from "@/lib/store";
import { THEMES, isTheme, type ThemeId, type ThemeInfo } from "@/lib/themes";

const SCRIPTS: { id: Settings["script"]; label: string; hint: string }[] = [
  { id: "uthmani", label: "উসমানি", hint: "মাদানী মুসহাফের রসমে উসমানি" },
  { id: "simple", label: "সহজ", hint: "প্রচলিত আরবি বানান" },
];

type Mode = "auto" | "system" | "fixed";
const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "auto", label: "সূর্য অনুযায়ী", hint: "সূর্যোদয়ে দিনের রঙ, মাগরিবে রাতের" },
  { id: "system", label: "ডিভাইস", hint: "ফোনের আলো-অন্ধকার মেনে" },
  { id: "fixed", label: "একটি রঙ", hint: "সবসময় একই রঙ" },
];
const DAY_THEMES = THEMES.filter((t) => t.kind === "day");
const NIGHT_THEMES = THEMES.filter((t) => t.kind === "night");

/** A row of theme tiles, each drawn in its own colours with its accent as the tara star. */
function ThemePicker({ name, themes, value, onPick }: { name: string; themes: ThemeInfo[]; value: ThemeId; onPick: (id: ThemeId) => void }) {
  return (
    <div className="themes">
      {themes.map((t) => (
        <label key={t.id} className="theme-opt">
          <input type="radio" name={name} id={`${name}-${t.id}`} checked={value === t.id} onChange={() => onPick(t.id)} />
          <span className="theme-sw" style={{ "--sw-g": t.ground, "--sw-p": t.paper, "--sw-a": t.accent } as React.CSSProperties} aria-hidden="true" />
          <b>{t.label}</b>
          <small>{t.hint}</small>
        </label>
      ))}
    </div>
  );
}

export default function SettingsButton() {
  const dlg = useRef<HTMLDialogElement>(null);
  const stored = useStored<Partial<Settings>>(KEYS.settings, {});
  const s = { ...DEFAULT_SETTINGS, ...stored };
  const city = s.city || cityForTimezone();
  const mode: Mode = s.theme === "auto" || s.theme === "system" ? s.theme : "fixed";
  const showing = (): ThemeId => {
    const t = document.documentElement.dataset.theme;
    return isTheme(t) ? t : "light";
  };

  return (
    <>
      <button type="button" className="icon-btn" onClick={() => dlg.current?.showModal()} aria-haspopup="dialog">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="10" cy="17" r="2" />
        </svg>
        <span className="visually-hidden">পড়ার সেটিং</span>
      </button>
      <dialog
        ref={dlg}
        className="sheet"
        aria-labelledby="settings-title"
        onClick={(e) => {
          if (e.target === dlg.current) dlg.current?.close();
        }}
      >
        <div className="sheet-in">
          <div className="sheet-head">
            <h2 id="settings-title">পড়ার সেটিং</h2>
            <button type="button" className="icon-btn" onClick={() => dlg.current?.close()}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
              <span className="visually-hidden">বন্ধ করুন</span>
            </button>
          </div>

          <fieldset className="field">
            <legend>রঙ</legend>
            <div className="seg seg-3">
              {MODES.map((m) => (
                <label key={m.id} className="seg-opt">
                  <input
                    type="radio"
                    name="theme-mode"
                    id={`theme-mode-${m.id}`}
                    checked={mode === m.id}
                    // A fixed theme starts from whatever is showing now, so choosing it never jumps.
                    onChange={() => saveSettings({ theme: m.id === "fixed" ? showing() : m.id })}
                  />
                  <span>
                    <b>{m.label}</b>
                    <small>{m.hint}</small>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {mode === "fixed" ? (
            <fieldset className="field">
              <legend className="visually-hidden">রঙ বেছে নিন</legend>
              <ThemePicker name="theme" themes={THEMES} value={isTheme(s.theme) ? s.theme : "light"} onPick={(id) => saveSettings({ theme: id })} />
            </fieldset>
          ) : (
            <>
              <fieldset className="field">
                <legend>দিনের রঙ</legend>
                <ThemePicker name="day" themes={DAY_THEMES} value={s.day} onPick={(id) => saveSettings({ day: id })} />
              </fieldset>
              <fieldset className="field">
                <legend>রাতের রঙ</legend>
                <ThemePicker name="night" themes={NIGHT_THEMES} value={s.night} onPick={(id) => saveSettings({ night: id })} />
              </fieldset>
            </>
          )}

          {s.theme === "auto" && (
            <div className="field">
              <label htmlFor="city">শহর</label>
              <select id="city" value={city} onChange={(e) => saveSettings({ city: e.target.value })}>
                {Object.entries(CITIES).map(([id, c]) => (
                  <option key={id} value={id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <small>সূর্যোদয় ও মাগরিবের সময় এই শহর থেকে হিসাব হয়।</small>
            </div>
          )}

          <fieldset className="field">
            <legend>আরবি লিপি</legend>
            <div className="seg">
              {SCRIPTS.map((sc) => (
                <label key={sc.id} className="seg-opt">
                  <input type="radio" name="script" id={`script-${sc.id}`} checked={s.script === sc.id} onChange={() => saveSettings({ script: sc.id })} />
                  <span>
                    <b>{sc.label}</b>
                    <small>{sc.hint}</small>
                  </span>
                </label>
              ))}
            </div>
            <small>দুটিই Tanzil Project-এর যাচাই করা পাঠ, হুবহু।</small>
          </fieldset>

          <div className="field">
            <label htmlFor="ar-size">
              আরবি লেখার আকার <output>{Math.round(s.arScale * 100)}%</output>
            </label>
            <input id="ar-size" type="range" min="0.8" max="1.6" step="0.1" value={s.arScale} onChange={(e) => saveSettings({ arScale: +e.target.value })} />
            <p className="ar sample" lang="ar" style={{ fontSize: `calc(1.6rem * ${s.arScale})` }}>
              {s.script === "simple" ? quranIndex.bismillahSimple : quranIndex.bismillah}
            </p>
          </div>

          <div className="field">
            <label htmlFor="tr-size">
              অনুবাদের আকার <output>{Math.round(s.trScale * 100)}%</output>
            </label>
            <input id="tr-size" type="range" min="0.85" max="1.4" step="0.05" value={s.trScale} onChange={(e) => saveSettings({ trScale: +e.target.value })} />
          </div>

          {quranIndex.bnEditions.length > 1 && s.showBn && (
            <fieldset className="field">
              <legend>বাংলা অনুবাদক</legend>
              <div className="seg">
                {quranIndex.bnEditions.map((ed, i) => (
                  <label key={ed.id} className="seg-opt">
                    <input type="radio" name="bn-ed" id={`bn-ed-${i}`} checked={s.bnEd === i} onChange={() => saveSettings({ bnEd: i })} />
                    <span>
                      <b>{ed.name}</b>
                      <small lang="en">{ed.englishName}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {quranIndex.enEditions.length > 1 && s.showEn && (
            <fieldset className="field">
              <legend>ইংরেজি অনুবাদক</legend>
              <div className="seg">
                {quranIndex.enEditions.map((ed, i) => (
                  <label key={ed.id} className="seg-opt">
                    <input type="radio" name="en-ed" id={`en-ed-${i}`} checked={s.enEd === i} onChange={() => saveSettings({ enEd: i })} />
                    <span>
                      <b lang="en">{ed.englishName}</b>
                      <small>{ed.id === "en.sahih" ? "রেকর্ড করা ইংরেজি তিলাওয়াত আছে" : "ডিভাইসের কণ্ঠে শোনা যাবে"}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <fieldset className="field">
            <legend>অনুবাদ দেখান</legend>
            <label className="check">
              <input type="checkbox" id="show-bn" checked={s.showBn && quranIndex.hasBengali} disabled={!quranIndex.hasBengali} onChange={(e) => saveSettings({ showBn: e.target.checked })} />
              <span>
                বাংলা
                {!quranIndex.hasBengali && <small>কোনো বাংলা অনুবাদ যুক্ত করা হয়নি। README দেখুন।</small>}
              </span>
            </label>
            <label className="check">
              <input type="checkbox" id="show-en" checked={s.showEn} onChange={(e) => saveSettings({ showEn: e.target.checked })} />
              <span>English</span>
            </label>
            <label className="check">
              <input type="checkbox" id="show-translit" checked={s.translit} onChange={(e) => saveSettings({ translit: e.target.checked })} />
              <span>
                উচ্চারণ
                <small>শব্দে শব্দে পড়ার সময় প্রতিটি শব্দের ল্যাটিন উচ্চারণ</small>
              </span>
            </label>
          </fieldset>
        </div>
      </dialog>
    </>
  );
}
