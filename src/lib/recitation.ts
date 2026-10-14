"use client";
import type { Track } from "./store";

/** Recorded recitations, one file per ayah, by global ayah number. */
export const RECORDED: Partial<Record<Track, { url: (g: number) => string; voice: string; note?: string }>> = {
  ar: { url: (g) => `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${g}.mp3`, voice: "Mishary Rashid Alafasy" },
  en: {
    url: (g) => `https://cdn.islamic.network/quran/audio/192/en.walk/${g}.mp3`,
    voice: "Ibrahim Walk",
    note: "Saheeh International",
  },
};

type Hooks = {
  count: number;
  firstGlobal: number;
  /** Tracks to play for the next ayah, already filtered to what this device can play. */
  tracks: () => Track[];
  /** True when this track has a recording matching the on-screen text; otherwise the device voice reads it. */
  recorded: (t: Track) => boolean;
  /** On-screen text for a spoken track, read aloud by the device's voice. */
  text: (t: Track, k: number) => string | null;
  voice: (t: Track) => SpeechSynthesisVoice | null;
  onAyah: (k: number | null) => void;
  onPart: (t: Track | null) => void;
  onPlaying: (playing: boolean) => void;
  onError: (message: string) => void;
  onFinish: () => void;
};

/** Splits long text into sentence-sized pieces; some browsers cut off long utterances. */
function chunks(text: string, max = 180): string[] {
  const parts = text.split(/(?<=[।.!?;:])\s+/);
  const out: string[] = [];
  let buf = "";
  for (const p of parts) {
    if (buf && (buf + " " + p).length > max) {
      out.push(buf);
      buf = p;
    } else buf = buf ? `${buf} ${p}` : p;
  }
  if (buf) out.push(buf);
  return out;
}

/**
 * Plays an ayah as a queue of tracks (Arabic, Bengali, English), repeats the whole
 * queue when asked, then moves to the next ayah. Every async callback carries the
 * token it was started with, so anything cancelled can never advance the queue.
 */
export class Recitation {
  speed = 1;
  repeat = 1;
  private audio: HTMLAudioElement | null = null;
  private token = 0;
  private k = 0;
  private steps: Track[] = [];
  private i = 0;
  private left = 1;
  private part: Track | null = null;
  private spoken = false;
  private paused = false;

  constructor(private h: Hooks) {}

  get current() {
    return this.k || null;
  }

  play(k: number) {
    this.halt();
    this.unlockSpeech();
    this.paused = false;
    this.h.onPlaying(true);
    this.startAyah(k, this.token);
  }

  pause() {
    if (!this.k || this.paused) return;
    this.paused = true;
    if (this.spoken) {
      // Speech pause is unreliable across browsers; cancel and re-read this part on resume.
      this.token++;
      speechSynthesis.cancel();
    } else this.audio?.pause();
    this.h.onPlaying(false);
  }

  resume() {
    if (!this.k) return;
    this.unlockSpeech();
    this.paused = false;
    this.h.onPlaying(true);
    if (this.spoken) this.runStep(this.token);
    else this.audio?.play().catch(() => this.fail());
  }

  stop() {
    this.halt();
    this.k = 0;
    this.part = null;
    this.h.onAyah(null);
    this.h.onPart(null);
    this.h.onPlaying(false);
  }

  setSpeed(v: number) {
    this.speed = v;
    if (this.audio) this.audio.playbackRate = v;
  }

  private halt() {
    this.token++;
    this.audio?.pause();
    if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  }

  /** iOS only allows speech that starts inside a tap; an empty utterance unlocks it. */
  private unlockSpeech() {
    if (typeof speechSynthesis === "undefined" || !(this.h.voice("bn") || this.h.voice("en"))) return;
    speechSynthesis.speak(new SpeechSynthesisUtterance(""));
  }

  private startAyah(k: number, token: number) {
    this.k = k;
    this.steps = this.h.tracks();
    this.i = 0;
    this.left = this.repeat;
    this.h.onAyah(k);
    this.runStep(token);
  }

  private runStep(token: number) {
    const t = this.steps[this.i];
    this.part = t;
    this.spoken = !this.h.recorded(t);
    this.h.onPart(t);
    if (this.spoken) this.speak(t, token);
    else this.playRecorded(t, token);
  }

  private next(token: number) {
    if (token !== this.token || this.paused) return;
    if (++this.i < this.steps.length) return this.runStep(token);
    if (this.left > 1) {
      this.left--;
      this.i = 0;
      return this.runStep(token);
    }
    if (this.k < this.h.count) return this.startAyah(this.k + 1, token);
    this.stop();
    this.h.onFinish();
  }

  private playRecorded(t: Track, token: number) {
    const src = RECORDED[t];
    if (!src) return this.next(token);
    const a = this.audio ?? (this.audio = new Audio());
    a.onended = () => this.next(token);
    a.onerror = () => token === this.token && this.fail();
    a.src = src.url(this.h.firstGlobal + this.k - 1);
    a.playbackRate = this.speed;
    a.play().catch(() => token === this.token && this.fail());
  }

  private speak(t: Track, token: number) {
    const text = this.h.text(t, this.k);
    const voice = this.h.voice(t);
    if (!text || !voice) return this.next(token);
    const pieces = chunks(text);
    let n = 0;
    const say = () => {
      if (token !== this.token) return;
      const u = new SpeechSynthesisUtterance(pieces[n]);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = Math.min(2, Math.max(0.5, this.speed));
      u.onend = () => (++n < pieces.length ? say() : this.next(token));
      u.onerror = (e) => {
        if (token !== this.token || e.error === "interrupted" || e.error === "canceled") return;
        this.next(token);
      };
      speechSynthesis.speak(u);
    };
    say();
  }

  private fail() {
    this.halt();
    this.paused = true;
    this.h.onPlaying(false);
    this.h.onError("তিলাওয়াত চালু করা যায়নি। ইন্টারনেট সংযোগ দেখে আবার চাপুন।");
  }
}
