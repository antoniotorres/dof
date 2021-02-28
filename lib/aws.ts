import AWS from "aws-sdk";

// Load S3 with env variables
const s3 = new AWS.S3({
  region: process.env.SERVER_AWS_REGION,
  accessKeyId: process.env.SERVER_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.SERVER_AWS_ACCESS_SECRET,
});

/**
 * Function to list objects inside bucket
 */
async function listObjectsBucket() {
  return new Promise<AWS.S3.ListObjectsOutput>((resolve, reject) => {
    const params = {
      Bucket: process.env.SERVER_AWS_BUCKET,
    };
    s3.listObjects(params, (s3Err, data) => {
      if (s3Err) reject(s3Err);
      resolve(data);
    });
  });
}

/**
 * Function to get the files inside the bucket
 */
export async function getFiles() {
  const list = await listObjectsBucket();
  return list.Contents;
}

/**
 * Function to store data into S3 bucket. AWS configs and bucket will
 * be loaded from env variables
 * @param filename Name or key of the file to store in S3 bucket
 * @param data String of data to store in S3 bucket
 */
export function uploadFile(filename: string, data: string) {
  const params = {
    Bucket: process.env.SERVER_AWS_BUCKET,
    Key: filename,
    Body: data,
  };
  s3.upload(params, function (s3Err, data) {
    if (s3Err) throw s3Err;
    console.log(`File uploaded successfully at ${data.Location}`);
  });
}
