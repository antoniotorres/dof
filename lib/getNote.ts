import { formatISO, isValid, parse } from "date-fns";

import { uploadFile } from "./r2";
import { sanitizeHTML } from "./sanitize";

export interface Note {
  metadata: { title: string; published_at: string };
  content: string;
}

async function fetchFromSource(id: string) {
  const response = await fetch(
    `https://dof.gob.mx/nota_detalle.php?codigo=${id}`,
  );
  const data = await response.text();
  return data;
}

async function fetchFromR2(id: string) {
  if (!process.env.R2_PUBLIC_URL) {
    throw new Error("R2 is not configured");
  }
  const response = await fetch(`${process.env.R2_PUBLIC_URL}/${id}.json`);
  const data = await response.text();
  if (response.status === 200) {
    return data;
  }
  throw new Error(data);
}

function findMetadata(data: string) {
  const detail =
    data.split("<div id='DivDetalleNota' align='justify'")[1] ?? data;
  const titleMatch = detail.match(/<title>(.*)<\/title>/)?.[0] ?? "";
  const title = unescape(
    titleMatch.replace("<title>", "").replace("</title>", ""),
  );

  const dofMatch = data.match(/<b>DOF:(.*)<\/b>/)?.[0] ?? "";
  const dateText = dofMatch.replace("<b>DOF:", "").replace("</b>", "").trim();
  // Guard against an unexpected/malformed date: don't let formatISO throw on an
  // Invalid Date and sink an otherwise-valid note. Downstream formatters treat
  // an empty published_at gracefully.
  const parsed = parse(dateText, "dd/MM/yyyy", new Date());
  const published_at = isValid(parsed) ? formatISO(parsed) : "";

  return { title, published_at };
}

/**
 * Fetch a note by id. Tries the R2 cache first; on a miss it downloads the
 * original DOF page, sanitizes it, caches it back to R2, and returns it.
 */
export async function getNote(id: string): Promise<Note> {
  const filename = `${id}.json`;

  try {
    const r2File = await fetchFromR2(id);
    console.log("File Found in R2 ... OK");
    if (r2File) {
      return JSON.parse(r2File) as Note;
    }
  } catch (error) {
    console.error(error);
  }

  // Download file from original DOF page
  console.log("Not Found in R2 ... Fallback to DOF");
  const source = await fetchFromSource(id);
  const metadata = findMetadata(source);
  const content = sanitizeHTML(source);
  const file: Note = { metadata, content };

  // Cache back to R2, but never let a write failure break the read path: the
  // note was already fetched successfully, so we always return it.
  try {
    await uploadFile(filename, JSON.stringify(file));
  } catch (error) {
    console.error("R2 cache write failed", error);
  }
  return file;
}
