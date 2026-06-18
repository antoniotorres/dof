import { cache } from "react";
import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getNoteFiles } from "@/lib/aws";
import { getNote, type Note } from "@/lib/getNote";
import { removeTags } from "@/lib/sanitize";

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
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const note = await loadNote(id);
  if (!note) return {};

  const title = `DOF | ${note.metadata.title.substring(0, 60)}`;
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `DOF | ${note.metadata.title.substring(0, 60)}`,
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
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <div>
        Fecha: {format(parseISO(note.metadata.published_at), "dd/MM/yyyy")}
      </div>
      <div dangerouslySetInnerHTML={{ __html: note.content }} />
    </article>
  );
}
