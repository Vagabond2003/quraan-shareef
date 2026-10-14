import Link from "next/link";
import NavLinks from "./NavLinks";
import SettingsButton from "./SettingsButton";

export default function SiteHeader() {
  return (
    <header className="site-head">
      <div className="wrap">
        <Link href="/" className="brand" aria-label="কুরআন শরীফ, প্রথম পাতা">
          <span className="brand-star" aria-hidden="true" />
          <span>
            <b>কুরআন শরীফ</b>
            <small lang="en">Quraan Shareef</small>
          </span>
        </Link>
        <NavLinks />
        <SettingsButton />
      </div>
    </header>
  );
}
