import { formatISO, parse } from "date-fns";

import { uploadFile } from "./aws";
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

async function fetchFromS3(id: string) {
  if (!process.env.SERVER_AWS_BUCKET || !process.env.SERVER_AWS_REGION) {
    throw new Error("S3 is not configured");
  }
  const response = await fetch(
    `https://${process.env.SERVER_AWS_BUCKET}.s3.${process.env.SERVER_AWS_REGION}.amazonaws.com/${id}.json`,
  );
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
  const published_at = formatISO(
    parse(
      dofMatch.replace("<b>DOF:", "").replace("</b>", "").trim(),
      "dd/MM/yyyy",
      new Date(),
    ),
  );

  return { title, published_at };
}

/**
 * Fetch a note by id. Tries the S3 cache first; on a miss it downloads the
 * original DOF page, sanitizes it, caches it back to S3, and returns it.
 */
export async function getNote(id: string): Promise<Note> {
  const filename = `${id}.json`;

  try {
    const s3File = await fetchFromS3(id);
    console.log("File Found in S3 ... OK");
    if (s3File) {
      return JSON.parse(s3File) as Note;
    }
  } catch (error) {
    console.error(error);
  }

  // Download file from original DOF page
  console.log("Not Found in S3 ... Fallback to DOF");
  const source = await fetchFromSource(id);
  const metadata = findMetadata(source);
  const content = sanitizeHTML(source);
  const file: Note = { metadata, content };

  // Cache back to S3, but never let a write failure break the read path: the
  // note was already fetched successfully, so we always return it.
  try {
    await uploadFile(filename, JSON.stringify(file));
  } catch (error) {
    console.error("S3 cache write failed", error);
  }
  return file;
}
