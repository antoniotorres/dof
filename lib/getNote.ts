import { uploadFile } from "./r2";
import { dofFetchText } from "./dofCA";
import { buildSourceUrl, noteFromSource, type Note } from "./dofSource";

export type { Note } from "./dofSource";

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
  const source = await dofFetchText(buildSourceUrl(id));
  const file = noteFromSource(source);

  // Cache back to R2, but never let a write failure break the read path: the
  // note was already fetched successfully, so we always return it.
  try {
    await uploadFile(filename, JSON.stringify(file));
  } catch (error) {
    console.error("R2 cache write failed", error);
  }
  return file;
}
