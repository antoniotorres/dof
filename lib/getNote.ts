import { formatISO, parse } from "date-fns";
import { uploadFile } from "./r2";
import { sanitizeHTML } from "./sanitize";

async function fetchFromSource(id: string) {
  const response = await fetch(
    `https://dof.gob.mx/nota_detalle.php?codigo=${id}`,
  );
  const data = await response.text();
  return data;
}

async function fetchFromR2(id: string) {
  const response = await fetch(`${process.env.R2_PUBLIC_URL}/${id}.json`);
  const data = await response.text();
  if (response.status === 200) {
    return data;
  }
  throw new Error(data);
}

function findMetadata(data: string) {
  const title = unescape(
    data
      .split("<div id='DivDetalleNota' align='justify'")[1]
      .match(/<title>(.*)<\/title>/g)[0]
      .replace("<title>", "")
      .replace("</title>", ""),
  );
  const published_at = formatISO(
    parse(
      data
        .match(/<b>DOF:(.*)<\/b>/g)[0]
        .replace("<b>DOF:", "")
        .replace("</b>", "")
        .trim(),
      "dd/MM/yyyy",
      new Date(),
    ),
  );
  return { title, published_at };
}

// Helper to make GET requests to Strapi
export async function getNote(id: string) {
  const filename = `${id}.json`;

  try {
    const r2File = await fetchFromR2(id);
    console.log("File Found in R2 ... OK");
    if (r2File) {
      return JSON.parse(r2File);
    }
  } catch (e) {
    console.error(e);
  }

  // Download file from original DOF page
  console.log("Not Found in R2 ... Fallback to DOF");
  const source = await fetchFromSource(id);
  const metadata = findMetadata(source);
  const content = sanitizeHTML(source);
  const file = { metadata, content };
  uploadFile(filename, JSON.stringify(file));
  return file;
}
