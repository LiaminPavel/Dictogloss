import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const endpoint = process.env.DO_SPACES_ENDPOINT;
const region = process.env.DO_SPACES_REGION;
const accessKeyId = process.env.DO_SPACES_KEY;
const secretAccessKey = process.env.DO_SPACES_SECRET;
const bucket = process.env.DO_SPACES_BUCKET;
const cdnUrl = process.env.DO_SPACES_CDN_URL;

const spacesClient =
  endpoint && region && accessKeyId && secretAccessKey
    ? new S3Client({
        endpoint,
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      })
    : null;

export async function uploadAudioToSpaces(key: string, body: Buffer): Promise<string> {
  if (!spacesClient || !bucket || !cdnUrl) {
    throw new Error("DO Spaces configuration is incomplete.");
  }

  await spacesClient.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "audio/mpeg",
      ACL: "private",
    }),
  );

  return `${cdnUrl.replace(/\/$/, "")}/${key}`;
}

export async function getPresignedAudioUrl(key: string): Promise<string> {
  if (!spacesClient || !bucket) {
    throw new Error("DO Spaces configuration is incomplete.");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  return getSignedUrl(spacesClient, command, { expiresIn: 300 });
}

export function extractStorageKeyFromAudioUrl(audioUrl: string): string {
  if (!cdnUrl) {
    throw new Error("DO Spaces configuration is incomplete.");
  }

  const normalizedCdn = cdnUrl.replace(/\/$/, "");
  if (!audioUrl.startsWith(normalizedCdn)) {
    throw new Error("Audio URL is not in configured storage.");
  }

  return audioUrl.slice(normalizedCdn.length + 1);
}
