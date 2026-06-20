import "server-only";

import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { getNoteFiles } from "./r2";
import { getNote, type Note } from "./getNote";
import { SAMPLE_DOCS, type DocCard } from "./sampleDocs";

export type { DocCard } from "./sampleDocs";

/**
 * DOF titles almost always begin with the instrument type in caps
 * ("DECRETO por el que…", "ACUERDO …"). We derive a short badge label from
 * that prefix. Order matters: longer / more specific prefixes come first.
 */
const TIPO_RULES: { prefix: string; label: string }[] = [
  { prefix: "NORMA OFICIAL MEXICANA", label: "NOM" },
  { prefix: "PROYECTO DE NORMA OFICIAL MEXICANA", label: "PROY-NOM" },
  { prefix: "DECRETO", label: "DECRETO" },
  { prefix: "ACUERDO", label: "ACUERDO" },
  { prefix: "RESOLUCION", label: "RESOLUCIÓN" },
  { prefix: "CONVOCATORIA", label: "CONVOCATORIA" },
  { prefix: "AVISO", label: "AVISO" },
  { prefix: "OFICIO", label: "OFICIO" },
  { prefix: "CIRCULAR", label: "CIRCULAR" },
  { prefix: "LINEAMIENTOS", label: "LINEAMIENTOS" },
  { prefix: "REGLAS", label: "REGLAS" },
  { prefix: "REGLAMENTO", label: "REGLAMENTO" },
  { prefix: "MANUAL", label: "MANUAL" },
  { prefix: "PROGRAMA", label: "PROGRAMA" },
  { prefix: "ESTATUTO", label: "ESTATUTO" },
  { prefix: "EXTRACTO", label: "EXTRACTO" },
  { prefix: "MODIFICACION", label: "MODIFICACIÓN" },
  { prefix: "NOTIFICACION", label: "NOTIFICACIÓN" },
  { prefix: "SENTENCIA", label: "SENTENCIA" },
  { prefix: "LISTA", label: "LISTA" },
  { prefix: "LEY", label: "LEY" },
];

/** Strip accents and upper-case for prefix matching. */
function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .trim();
}

export function deriveTipo(title: string): string {
  const normalized = normalize(title);
  for (const { prefix, label } of TIPO_RULES) {
    if (normalized.startsWith(prefix)) return label;
  }
  return "DOCUMENTO";
}

function toCard(id: string, note: Note): DocCard | null {
  const iso = note.metadata.published_at;
  let fecha = "";
  let publishedAt = iso;
  try {
    const parsed = parseISO(iso);
    fecha = format(parsed, "d LLL yyyy", { locale: es }).replace(/\./g, "");
    publishedAt = parsed.toISOString();
  } catch {
    // Keep the raw value if the stored date can't be parsed.
    fecha = iso;
  }

  const titulo = note.metadata.title?.trim();
  if (!titulo) return null;

  return {
    id,
    tipo: deriveTipo(titulo),
    titulo,
    fecha,
    publishedAt,
    folio: id,
  };
}

/**
 * Return the most recently published notes as display cards. Falls back to the
 * curated sample documents whenever S3 is unavailable, unconfigured, or empty,
 * so the redesign always has content to render.
 */
export async function getRecentDocs(limit = 6): Promise<DocCard[]> {
  try {
    const files = await getNoteFiles();
    if (files.length === 0) return SAMPLE_DOCS.slice(0, limit);

    const recent = [...files]
      .sort(
        (a, b) =>
          (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0),
      )
      .slice(0, limit);

    const cards = await Promise.all(
      recent.map(async (file) => {
        try {
          return toCard(file.id, await getNote(file.id));
        } catch (error) {
          console.error(`Failed to load note ${file.id}`, error);
          return null;
        }
      }),
    );

    const resolved = cards.filter((card): card is DocCard => card !== null);
    return resolved.length > 0 ? resolved : SAMPLE_DOCS.slice(0, limit);
  } catch (error) {
    console.error(error);
    return SAMPLE_DOCS.slice(0, limit);
  }
}
