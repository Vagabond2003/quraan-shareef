import { arNum } from "@/lib/num";

/** Eight-pointed tara star carrying the ayah number in Arabic-Indic digits. */
export default function AyahMarker({ n }: { n: number }) {
  return (
    <span className="am" aria-label={`(${n})`}>
      <span>{arNum(n)}</span>
    </span>
  );
}
