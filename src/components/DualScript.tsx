/** Both Tanzil scripts in the markup; the root's data-script attribute shows one, so switching needs no reload or refetch. */
export default function DualScript({ uthmani, simple }: { uthmani: string; simple: string }) {
  return (
    <>
      <span className="ar-u">{uthmani}</span>
      <span className="ar-s">{simple}</span>
    </>
  );
}
