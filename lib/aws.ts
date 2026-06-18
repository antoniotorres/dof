import "server-only";

import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
  type _Object,
} from "@aws-sdk/client-s3";

// Server-side S3 client. Credentials come from server-only env vars and are
// never exposed to the browser (see the `server-only` import above).
const s3 = new S3Client({
  region: process.env.SERVER_AWS_REGION,
  credentials: {
    accessKeyId: process.env.SERVER_AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.SERVER_AWS_ACCESS_SECRET ?? "",
  },
});

export interface NoteFile {
  /** The note id (the S3 object key without the `.json` extension). */
  id: string;
  lastModified?: Date;
}

/**
 * List every note stored in the bucket, normalized to `{ id, lastModified }`.
 * In AWS SDK v3 the object `Key` is optional, so entries without one are
 * filtered out.
 */
export async function getNoteFiles(): Promise<NoteFile[]> {
  // Without S3 configuration there are no notes to list. Returning an empty
  // list (instead of letting the AWS SDK throw) keeps `next build` working in
  // environments where the credentials are intentionally absent.
  if (!process.env.SERVER_AWS_REGION || !process.env.SERVER_AWS_BUCKET) {
    // Logged at error level so a misconfigured deployment (which would ship an
    // empty sitemap / no pre-rendered notes) is visible in production logs.
    // Pages are still generated on demand at runtime when S3 is reachable.
    console.error("S3 is not configured; skipping note listing.");
    return [];
  }

  const result = await s3.send(
    new ListObjectsV2Command({ Bucket: process.env.SERVER_AWS_BUCKET }),
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
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.SERVER_AWS_BUCKET,
      Key: filename,
      Body: data,
      ContentType: "application/json",
    }),
  );
}
