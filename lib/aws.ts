import AWS from "aws-sdk";

// Load S3 with env variables
const s3 = new AWS.S3({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_ACCESS_SECRET,
});

/**
 * Function to store data into S3 bucket. AWS configs and bucket will
 * be loaded from env variables
 * @param filename Name or key of the file to store in S3 bucket
 * @param data String of data to store in S3 bucket
 */
export function uploadFile(filename: string, data: string) {
  const params = {
    Bucket: process.env.AWS_BUCKET,
    Key: filename,
    Body: data,
  };
  s3.upload(params, function (s3Err, data) {
    if (s3Err) throw s3Err;
    console.log(`File uploaded successfully at ${data.Location}`);
  });
}
