import type { Metadata, Viewport } from "next";
import { Amiri, Amiri_Quran, Hind_Siliguri, Schibsted_Grotesk, Tiro_Bangla } from "next/font/google";
import SiteHeader from "@/components/SiteHeader";
import ServiceWorker from "@/components/ServiceWorker";
import { THEME_SCRIPT } from "@/lib/theme-script";
import { quranIndex } from "@/lib/meta";
import { BASE } from "@/lib/base";
import "./globals.css";

const amiriQuran = Amiri_Quran({ weight: "400", subsets: ["arabic"], variable: "--font-amiri-quran", display: "swap" });
// Not preloaded: Amiri only draws surah-name headings and Tiro only translations, so they load when a
// page uses them instead of competing with every first paint (together about 260 KB).
const amiri = Amiri({ weight: ["400", "700"], subsets: ["arabic"], variable: "--font-amiri", display: "swap", preload: false });
const tiro = Tiro_Bangla({ weight: "400", subsets: ["bengali"], variable: "--font-tiro-bangla", display: "swap", preload: false });
const hind = Hind_Siliguri({ weight: ["400", "500", "600"], subsets: ["bengali", "latin"], variable: "--font-hind-siliguri", display: "swap" });
const schibsted = Schibsted_Grotesk({ subsets: ["latin"], variable: "--font-schibsted", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  manifest: `${BASE}/manifest.webmanifest`,
  title: { default: "কুরআন শরীফ · Quraan Shareef", template: "%s · কুরআন শরীফ" },
  description: "পবিত্র কুরআন আরবি, বাংলা ও ইংরেজিতে পড়ুন। মুসহাফের মতো পাতা উল্টান, তিলাওয়াত শুনুন, যেখানে থেমেছিলেন সেখান থেকে শুরু করুন।",
  applicationName: "কুরআন শরীফ",
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f6fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0a1230" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="bn"
      suppressHydrationWarning
      className={`${amiriQuran.variable} ${amiri.variable} ${tiro.variable} ${hind.variable} ${schibsted.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <footer className="site-foot">
          <div className="wrap">
            <p>
              আরবি পাঠ: <a href="https://tanzil.net" rel="noopener">Tanzil Project</a> (উসমানি ও সহজ লিপি)।
              {quranIndex.hasBengali && ` বাংলা অনুবাদ: ${quranIndex.bnEditions.map((e) => e.name).join(" ও ")}, Tanzil-এর মাধ্যমে, অবাণিজ্যিক ব্যবহারের শর্তে।`}{" "}
              ইংরেজি অনুবাদ: Saheeh International (Tanzil-এর মাধ্যমে, অবাণিজ্যিক ব্যবহারের শর্তে) ও আবদুল্লাহ ইউসুফ আলী (১৯৩৪)। তিলাওয়াত: মিশারি রাশিদ আল-আফাসি (আরবি) ও ইব্রাহিম ওয়াক (ইংরেজি), Islamic Network CDN-এর মাধ্যমে।
            </p>
            <p lang="en">Concept redesign of quraanshareef.org. Not affiliated with that site.</p>
          </div>
        </footer>
        <ServiceWorker />
      </body>
    </html>
  );
}
