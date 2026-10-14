// The reading themes. Colours live in globals.css as token sets under :root[data-theme="<id>"];
// this file holds what the settings panel and the pre-paint theme script need to know about them.
export type ThemeId = "light" | "paper" | "terracotta" | "celadon" | "dark" | "lantern";

export type ThemeInfo = {
  id: ThemeId;
  label: string;
  hint: string;
  /** Day themes can be the sun-following day choice; night themes the night choice. */
  kind: "day" | "night";
  /** Swatch colours, and `ground` for the browser's address-bar colour. */
  ground: string;
  paper: string;
  accent: string;
};

export const THEMES: ThemeInfo[] = [
  { id: "light", label: "চীনামাটি", hint: "তারা মসজিদের নীল-সাদা", kind: "day", ground: "#f3f6fb", paper: "#ffffff", accent: "#2546b4" },
  { id: "paper", label: "মুসহাফের পাতা", hint: "ঘিয়ে কাগজ, সোনালি নকশা", kind: "day", ground: "#efe6d2", paper: "#faf5ea", accent: "#8a5a10" },
  { id: "terracotta", label: "পোড়ামাটি", hint: "বাঘা মসজিদের ইট", kind: "day", ground: "#f0e2d2", paper: "#fbf4eb", accent: "#a1421d" },
  { id: "celadon", label: "মোগল সবুজ", hint: "লালবাগের সবুজ মিনা", kind: "day", ground: "#edf3ef", paper: "#ffffff", accent: "#1d6a4e" },
  { id: "dark", label: "কোবাল্ট রাত", hint: "নীল কাচের রাত", kind: "night", ground: "#0a1230", paper: "#0f1a3e", accent: "#8ea7ff" },
  { id: "lantern", label: "লণ্ঠন", hint: "নিকষ কালো, প্রদীপের সোনা", kind: "night", ground: "#000000", paper: "#0e0c09", accent: "#e0ac52" },
];

export const isTheme = (v: unknown): v is ThemeId => THEMES.some((t) => t.id === v);
