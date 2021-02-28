import { uploadFile } from "./aws";
import { sanitizeHTML } from "./sanitize";

async function fetchFromSource(id: string) {
  const response = await fetch(
    `https://dof.gob.mx/nota_detalle.php?codigo=${id}`,
  );
  const data = await response.text();
  return data;
}

async function fetchFromS3(id: string) {
  const response = await fetch(
    `https://${process.env.SERVER_AWS_BUCKET}.s3.${process.env.SERVER_AWS_REGION}.amazonaws.com/${id}.php`,
  );
  const data = await response.text();
  if (response.status === 200) {
    return data;
  }
  throw new Error(data);
}

// Helper to make GET requests to Strapi
export async function getNote(id: string) {
  const filename = `${id}.php`;

  try {
    const s3File = await fetchFromS3(id);
    console.log("File Found in S3 ... OK");
    if (s3File) {
      return s3File;
    }
  } catch (e) {
    console.error(e);
  }

  // Download file from original DOF page
  console.log("Not Found in S3 ... Fallback to DOF");
  const source = await fetchFromSource(id);
  uploadFile(filename, sanitizeHTML(source));
  return sanitizeHTML(source);
}
