import {
  S3Client,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

// R2 is S3-compatible. Credentials and endpoint come from env vars.
const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
});

/**
 * List the objects stored in the R2 bucket.
 */
export async function getFiles() {
  const output = await r2.send(
    new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET }),
  );
  return output.Contents;
}

/**
 * Store a string of data into the R2 bucket under the given key.
 * @param filename Key of the object to store
 * @param data String body to store
 */
export async function uploadFile(filename: string, data: string) {
  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: filename,
      Body: data,
      ContentType: "application/json",
    }),
  );
  console.log(`File uploaded successfully: ${filename}`);
}
