// Storage adapter. In dev (no MinIO endpoint) writes to ./storage/{public,private}
// and serves public files via /api/storage/public/[...key]. Production swap:
// set MINIO_* envs and the S3 client takes over.

import { promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const useS3 = !!(
  process.env.MINIO_ENDPOINT &&
  process.env.MINIO_ACCESS_KEY &&
  process.env.MINIO_SECRET_KEY &&
  process.env.STORAGE_BACKEND !== "local"
);

const LOCAL_ROOT = path.resolve(process.cwd(), "storage");
const PUBLIC_BUCKET = process.env.MINIO_BUCKET_PUBLIC ?? "public-assets";
const PRIVATE_BUCKET = process.env.MINIO_BUCKET_PRIVATE ?? "private-stl";

const s3 = useS3
  ? new S3Client({
      endpoint: process.env.MINIO_ENDPOINT!,
      region: "us-east-1",
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY!,
        secretAccessKey: process.env.MINIO_SECRET_KEY!,
      },
    })
  : null;

export type Visibility = "public" | "private";

function bucketFor(v: Visibility) {
  return v === "public" ? PUBLIC_BUCKET : PRIVATE_BUCKET;
}

async function ensureLocal(v: Visibility) {
  const dir = path.join(LOCAL_ROOT, v);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string,
  visibility: Visibility,
): Promise<{ key: string; url?: string }> {
  if (s3) {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucketFor(visibility),
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    if (visibility === "public") {
      const base =
        process.env.MINIO_PUBLIC_URL ??
        `${process.env.MINIO_ENDPOINT}/${PUBLIC_BUCKET}`;
      return { key, url: `${base}/${key}` };
    }
    return { key };
  }
  const dir = await ensureLocal(visibility);
  const full = path.join(dir, key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body);
  if (visibility === "public") {
    return { key, url: `/api/storage/public/${key}` };
  }
  return { key };
}

export async function getPrivateObjectStream(
  key: string,
): Promise<{ stream: Readable; contentType: string } | null> {
  if (s3) {
    try {
      const res = await s3.send(
        new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }),
      );
      return {
        stream: res.Body as Readable,
        contentType: res.ContentType ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }
  const full = path.join(LOCAL_ROOT, "private", key);
  try {
    await fs.access(full);
  } catch {
    return null;
  }
  const { createReadStream } = await import("node:fs");
  return {
    stream: createReadStream(full),
    contentType: "application/octet-stream",
  };
}

export async function getPublicObjectStream(
  key: string,
): Promise<{ stream: Readable; contentType: string } | null> {
  if (s3) {
    try {
      const res = await s3.send(
        new GetObjectCommand({ Bucket: PUBLIC_BUCKET, Key: key }),
      );
      return {
        stream: res.Body as Readable,
        contentType: res.ContentType ?? "application/octet-stream",
      };
    } catch {
      return null;
    }
  }
  const full = path.join(LOCAL_ROOT, "public", key);
  try {
    await fs.access(full);
  } catch {
    return null;
  }
  const { createReadStream } = await import("node:fs");
  return {
    stream: createReadStream(full),
    contentType: "application/octet-stream",
  };
}

export async function presignPrivateGet(key: string, expiresSec = 300) {
  if (!s3) return `/api/admin/stl/${encodeURIComponent(key)}`;
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: PRIVATE_BUCKET, Key: key }),
    { expiresIn: expiresSec },
  );
}
