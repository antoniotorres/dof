import Link from "next/link";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import HeroSearch from "@/components/home/HeroSearch";
import { getRecentDocs } from "@/lib/recentNotes";

const CHIPS = ["Edición de hoy", "Por dependencia", "Por fecha", "Búsqueda avanzada"];

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      aria-hidden="true"
      className={className}
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const initialQuery = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");

  const docs = await getRecentDocs(6);
  const editionDate = docs[0]?.publishedAt
    ? parseISO(docs[0].publishedAt)
    : new Date();

  const longDate = capitalize(
    format(editionDate, "EEEE d 'de' MMMM 'de' yyyy", { locale: es }),
  );
  const dayLine = capitalize(
    format(editionDate, "EEEE d 'de' MMMM", { locale: es }),
  );
  const yearLine = format(editionDate, "'de' yyyy", { locale: es });

  return (
    <main>
      {/* Hero search */}
      <section className="mx-auto max-w-[760px] px-7 pb-[52px] pt-[88px] text-center">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-edge px-[13px] py-[5px] text-[12.5px] text-zinc-500">
          <span className="h-[7px] w-[7px] rounded-full bg-[#16a34a]" />
          Edición publicada · {longDate}
        </div>
        <h1 className="mx-auto mb-[18px] max-w-[620px] text-balance font-serif text-[40px] font-semibold leading-[1.06] tracking-[-0.025em] sm:text-[50px]">
          El registro oficial de México, al alcance de una búsqueda
        </h1>
        <p className="mx-auto mb-9 max-w-[480px] text-[18px] leading-[1.5] text-zinc-500">
          Encuentra decretos, acuerdos, normas y resoluciones publicados por el
          Estado mexicano.
        </p>

        <HeroSearch key={initialQuery} docs={docs} initialQuery={initialQuery} />

        {/* Quick chips */}
        <div className="mt-6 flex flex-wrap justify-center gap-[9px]">
          {CHIPS.map((chip) => (
            <Link
              key={chip}
              href="/notas"
              className="rounded-full border border-edge bg-white px-[15px] py-2 text-[13px] text-zinc-600 transition-colors hover:border-accent hover:text-accent"
            >
              {chip}
            </Link>
          ))}
        </div>
      </section>

      {/* Edición del día */}
      <section className="mx-auto max-w-[1100px] px-7 py-6">
        <div className="flex flex-col items-stretch overflow-hidden rounded-[20px] border border-edge bg-white sm:flex-row">
          <div className="flex flex-1 flex-col justify-center bg-accent px-9 py-[34px] text-white sm:min-w-[280px]">
            <h2 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] opacity-70">
              Edición del día
            </h2>
            <span className="my-[10px] mb-[6px] font-serif text-[30px] font-semibold leading-[1.12] tracking-[-0.01em]">
              {dayLine}
              <br />
              {yearLine}
            </span>
            <span className="text-[14px] opacity-[0.78]">Edición vigente</span>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-[6px] px-9 py-[30px] sm:min-w-[300px] sm:flex-[2]">
            {[
              { name: "Edición Matutina", sub: "Consultar publicaciones" },
              { name: "Edición Vespertina", sub: "Consultar publicaciones" },
            ].map((row, index) => (
              <Link
                key={row.name}
                href="/notas"
                className={`flex items-center justify-between py-4 text-left transition hover:opacity-70 ${
                  index === 0 ? "border-b border-line-soft" : ""
                }`}
              >
                <span>
                  <span className="block text-[15px] font-semibold">
                    {row.name}
                  </span>
                  <span className="text-[13px] text-zinc-400">{row.sub}</span>
                </span>
                <span className="flex items-center gap-[5px] text-[13px] font-semibold text-accent">
                  Abrir <ChevronRight />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Más consultados */}
      <section className="mx-auto max-w-[1100px] px-7 pb-[72px] pt-10">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-serif text-[23px] font-semibold tracking-[-0.01em]">
            Más consultados esta semana
          </h2>
          <Link
            href="/notas"
            className="text-[13.5px] font-medium text-accent"
          >
            Ver todos
          </Link>
        </div>
        <ul className="border-t border-line">
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
      </section>
    </main>
  );
}
