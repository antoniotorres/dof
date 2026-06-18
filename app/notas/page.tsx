import Link from "next/link";
import type { Metadata } from "next";

import { getRecentDocs } from "@/lib/recentNotes";

export const metadata: Metadata = {
  title: "Ediciones recientes",
  description: "Publicaciones recientes del Diario Oficial de la Federación.",
};

export default async function NotasPage() {
  const docs = await getRecentDocs(30);

  return (
    <main className="mx-auto max-w-[1100px] px-4 pb-[72px] pt-12 sm:px-7">
      <header className="mb-2">
        <h1 className="font-serif text-[32px] font-semibold tracking-[-0.02em]">
          Ediciones recientes
        </h1>
        <p className="mt-2 text-[15px] text-zinc-500">
          Publicaciones más recientes del Diario Oficial de la Federación.
        </p>
      </header>

      <ul className="mt-6 border-t border-line">
        {docs.map((doc, index) => (
          <li key={doc.id}>
            <Link
              href={`/notas/${doc.id}`}
              className="flex items-center gap-[22px] border-b border-line-soft px-[6px] py-5 text-left transition-colors hover:bg-[#fafafa]"
            >
              <span className="w-[26px] flex-none text-center font-serif text-[17px] text-[#c4c4c9]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="hidden w-[104px] flex-none sm:block">
                <span className="inline-block rounded-md bg-accent-tint px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[0.04em] text-accent">
                  {doc.tipo}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15.5px] font-medium leading-[1.35] text-zinc-800">
                  {doc.titulo}
                </span>
                {doc.dependencia && (
                  <span className="mt-[3px] block text-[13px] text-zinc-400">
                    {doc.dependencia}
                  </span>
                )}
              </span>
              <span className="hidden w-[110px] flex-none text-right text-[12.5px] text-[#bcbcc2] sm:block">
                {doc.fecha}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
