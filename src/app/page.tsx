import Link from "next/link";
import Mosaic from "@/components/Mosaic";
import ContinueCard from "@/components/ContinueCard";
import JumpField from "@/components/JumpField";
import Bookmarks from "@/components/Bookmarks";
import { surahs, juzStartPage } from "@/lib/meta";
import { bnNum } from "@/lib/num";

export default function Home() {
  return (
    <>
      <section className="mast" aria-labelledby="home-title">
        <Mosaic seed={11} cell={30} stars />
        <div className="wrap mast-in">
          <div className="mast-tile">
            <h1 id="home-title">কুরআন শরীফ</h1>
            <p className="ar" lang="ar">القُرْآنُ الكَرِيمُ</p>
          </div>
        </div>
      </section>

      <div className="wrap home">
        <div className="home-top">
          <ContinueCard />
          <JumpField />
        </div>

        <Bookmarks />

        <section className="juz" aria-labelledby="juz-title">
          <h2 id="juz-title">পারা</h2>
          <ol className="juz-grid">
            {Array.from({ length: 30 }, (_, i) => i + 1).map((j) => (
              <li key={j}>
                <Link href={`/mushaf/${juzStartPage(j)}`} aria-label={`পারা ${bnNum(j)}, পৃষ্ঠা ${bnNum(juzStartPage(j))}`}>
                  {bnNum(j)}
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section id="index" className="index" aria-labelledby="index-title">
          <h2 id="index-title">সূরা</h2>
          <ol className="surah-list">
            {surahs.map((s) => (
              <li key={s.n}>
                <Link href={`/surah/${s.n}`} className="surah-row">
                  <span className="am surah-no" aria-hidden="true">
                    <span>{bnNum(s.n)}</span>
                  </span>
                  <span className="surah-names">
                    <b>{s.bn}</b>
                    <small lang="en">
                      {s.en} · {s.meaning}
                    </small>
                  </span>
                  <span className="surah-facts">
                    {s.type === "meccan" ? "মক্কী" : "মাদানী"} · {bnNum(s.count)} আয়াত
                  </span>
                  <span className="surah-ar ar" lang="ar">
                    {s.ar.replace(/^سُورَةُ\s*/, "")}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
