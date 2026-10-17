import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true, // Necessary for custom S3 compatible endpoints
});

const BUCKET_NAME = process.env.NEON_STORAGE_BUCKET || "assets";

/**
 * Uploads a file buffer or string directly to Neon Object Storage (S3)
 */
export async function uploadToStorage(
  key: string,
  body: Buffer | Uint8Array | string,
  contentType: string = "application/octet-stream"
) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  const response = await s3Client.send(command);
  return {
    key,
    bucket: BUCKET_NAME,
    etag: response.ETag,
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
  };
}

/**
 * Generates a presigned read URL for an asset in Neon Object Storage
 */
export async function getPresignedDownloadUrl(key: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

/**
 * Lists objects in the Neon S3 bucket to verify storage health
 */
export async function listStorageObjects(maxKeys = 10) {
  const command = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
    MaxKeys: maxKeys,
  });

  return await s3Client.send(command);
}

export { s3Client, BUCKET_NAME };
