import Link from "next/link";
import { cache } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNoteFiles } from "@/lib/r2";
import { getNote, type Note } from "@/lib/getNote";
import { getSampleNote } from "@/lib/sampleDocs";
import { deriveTipo } from "@/lib/recentNotes";
import { removeTags } from "@/lib/sanitize";
import { buildToc } from "@/lib/toc";
import ReadingPane from "@/components/reader/ReadingPane";
import DocToc from "@/components/reader/DocToc";

const BASE_URL = "https://dof.toniotgz.com";

// Allow notes that were not pre-rendered at build time to be generated on
// demand at request time (the App Router equivalent of `fallback: true`).
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const files = await getNoteFiles();
    return files.map((file) => ({ id: file.id }));
  } catch (error) {
    // If S3 is unreachable at build time, fall back to fully on-demand
    // generation instead of failing the build.
    console.error(error);
    return [];
  }
}

// Memoized per request so generateMetadata and the page component share a
// single getNote() call (avoids a duplicate parse and a duplicate S3 write).
const loadNote = cache(async (id: string): Promise<Note | null> => {
  try {
    return await getNote(id);
  } catch (error) {
    console.error(error);
    // When S3 and the upstream DOF source are both unavailable, serve concept
    // content for known sample ids so the redesign stays navigable.
    return getSampleNote(id);
  }
});

function formatLongDate(iso: string): string {
  try {
    return format(parseISO(iso), "d 'de' MMMM 'de' yyyy", { locale: es });
  } catch {
    return iso;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const note = await loadNote(id);
  if (!note) return {};

  const title = note.metadata.title.substring(0, 70);
  return {
    title,
    alternates: { canonical: `/notas/${id}` },
    openGraph: {
      type: "article",
      url: `${BASE_URL}/notas/${id}`,
      title,
      publishedTime: note.metadata.published_at,
    },
  };
}

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await loadNote(id);
  if (!note) notFound();

  const tipo = deriveTipo(note.metadata.title);
  const fecha = formatLongDate(note.metadata.published_at);
  const { html, toc } = buildToc(note.content);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: note.metadata.title.substring(0, 70),
    image: [`${BASE_URL}/apple-touch-icon.png`],
    datePublished: note.metadata.published_at,
    dateModified: note.metadata.published_at,
    author: [{ "@type": "Organization", name: "Gobierno de Mexico" }],
    publisher: {
      "@type": "Organization",
      name: "Gobierno de Mexico",
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/apple-touch-icon.png`,
      },
    },
    description: removeTags(note.content.substring(0, 512)).trim(),
  };

  return (
    <main className="mx-auto max-w-[1140px] animate-[fadeUp_0.3s_ease] px-4 pb-24 pt-7 sm:px-7">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <Link
        href="/"
        className="mb-2 inline-flex items-center gap-[7px] py-2 text-[13.5px] text-zinc-500 transition-colors hover:text-accent"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.2}
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Volver al inicio
      </Link>

      <div className="grid grid-cols-1 items-start gap-x-[54px] gap-y-10 lg:grid-cols-[minmax(0,1fr)_296px]">
        {/* Reading column */}
        <article>
          <span className="mb-[18px] inline-block rounded-[7px] bg-accent-tint px-[11px] py-1 text-[11px] font-semibold tracking-[0.05em] text-accent">
            {tipo}
          </span>
          <h1 className="mb-[18px] text-pretty font-serif text-[28px] font-semibold leading-[1.18] tracking-[-0.015em] sm:text-[34px]">
            {note.metadata.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-[18px] gap-y-[10px] border-b border-line pb-[22px] text-[13.5px] text-zinc-500">
            <span>{fecha}</span>
          </div>

          <ReadingPane content={html} title={note.metadata.title} />
        </article>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-[84px]">
          <div className="rounded-2xl border border-edge bg-white px-[22px] py-5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-400">
              Datos de publicación
            </span>
            <dl className="mt-[14px] flex flex-col gap-[13px]">
              <div>
                <dt className="mb-[2px] text-[12px] text-zinc-400">
                  Fecha de publicación
                </dt>
                <dd className="text-[14px] font-medium text-zinc-800">
                  {fecha}
                </dd>
              </div>
              <div>
                <dt className="mb-[2px] text-[12px] text-zinc-400">
                  Tipo de documento
                </dt>
                <dd className="text-[14px] font-medium text-zinc-800">
                  {tipo}
                </dd>
              </div>
              <div>
                <dt className="mb-[2px] text-[12px] text-zinc-400">
                  Folio DOF
                </dt>
                <dd className="text-[14px] font-medium tabular-nums text-zinc-800">
                  {id}
                </dd>
              </div>
            </dl>
          </div>

          {toc.length > 0 && <DocToc items={toc} />}
        </aside>
      </div>
    </main>
  );
}
