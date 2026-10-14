import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import MushafBook from "@/components/MushafBook";
import { getPage, index } from "@/lib/quran";
import { bnNum } from "@/lib/num";

export function generateStaticParams() {
  return Array.from({ length: index.pageCount }, (_, i) => ({ page: String(i + 1) }));
}

export async function generateMetadata({ params }: { params: Promise<{ page: string }> }): Promise<Metadata> {
  const { page } = await params;
  return {
    title: `মুসহাফ · পৃষ্ঠা ${bnNum(+page)}`,
    description: `মাদানী মুসহাফের পৃষ্ঠা ${bnNum(+page)}, বইয়ের মতো পাতা উল্টে পড়ুন।`,
    alternates: { canonical: `/mushaf/${page}` },
  };
}

export default function MushafRoute({ params }: { params: Promise<{ page: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="wrap mushaf-wrap" aria-busy="true">
          <p className="route-wait">পৃষ্ঠা লোড হচ্ছে…</p>
        </div>
      }
    >
      <Mushaf params={params} />
    </Suspense>
  );
}

async function Mushaf({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  const p = Number(page);
  if (!(p >= 1 && p <= index.pageCount)) notFound();
  const near = [];
  for (let n = Math.max(1, p - 2); n <= Math.min(index.pageCount, p + 3); n++) near.push(n);
  const seed = near.map(getPage);

  return (
    <div className="wrap mushaf-wrap">
      <h1 className="visually-hidden">মুসহাফ, পৃষ্ঠা {bnNum(p)}</h1>
      <MushafBook initialPage={p} seed={seed} />
    </div>
  );
}
