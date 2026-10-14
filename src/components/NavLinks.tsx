"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStored, KEYS, type LastRead } from "@/lib/store";

export default function NavLinks() {
  const path = usePathname();
  const last = useStored<LastRead | null>(KEYS.last, null);
  const mushafHref = `/mushaf/${last?.page ?? 1}`;
  return (
    <nav className="nav" aria-label="প্রধান">
      <Link href="/#index" aria-current={path === "/" ? "page" : undefined}>
        সূচি
      </Link>
      <Link href={mushafHref} aria-current={path.startsWith("/mushaf") ? "page" : undefined}>
        মুসহাফ
      </Link>
    </nav>
  );
}
