import "server-only";

import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3";

// Server-side Cloudflare R2 client. R2 is S3-compatible, so we use the AWS S3
// SDK pointed at the R2 endpoint. Credentials come from server-only env vars
// and are never exposed to the browser (see the `server-only` import above).
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  },
});

export interface NoteFile {
  /** The note id (the R2 object key without the `.json` extension). */
  id: string;
  lastModified?: Date;
}

/**
 * List every note stored in the bucket, normalized to `{ id, lastModified }`.
 * In AWS SDK v3 the object `Key` is optional, so entries without one are
 * filtered out.
 */
export async function getNoteFiles(): Promise<NoteFile[]> {
  // Without R2 configuration there are no notes to list. Returning an empty
  // list (instead of letting the SDK throw) keeps `next build` working in
  // environments where the credentials are intentionally absent.
  if (!process.env.R2_ACCOUNT_ID || !process.env.R2_BUCKET) {
    // Logged at error level so a misconfigured deployment (which would ship an
    // empty sitemap / no pre-rendered notes) is visible in production logs.
    // Pages are still generated on demand at runtime when R2 is reachable.
    console.error("R2 is not configured; skipping note listing.");
    return [];
  }

  const result = await r2.send(
    new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET }),
  );

  return (result.Contents ?? [])
    .filter((object): object is _Object & { Key: string } =>
      Boolean(object.Key),
    )
    .map((object) => ({
      id: object.Key.replace(".json", ""),
      lastModified: object.LastModified,
    }));
}

/**
 * Store a string payload in the bucket under `filename`.
 */
export async function uploadFile(
  filename: string,
  data: string,
): Promise<void> {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: filename,
      Body: data,
      ContentType: "application/json",
    }),
  );
}
