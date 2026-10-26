import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const env = () => ({
  accountId: process.env.R2_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET,
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL,
});

export function r2MediaConfigured() {
  const config = env();
  if (!Object.values(config).every((value) => typeof value === 'string' && value.trim())) return false;
  try {
    const publicUrl = new URL(config.publicBaseUrl);
    return publicUrl.protocol === 'https:' && !publicUrl.search && !publicUrl.hash;
  } catch {
    return false;
  }
}

let client;
function getClient() {
  if (!r2MediaConfigured()) throw new Error('R2 media storage is not configured.');
  if (!client) {
    const config = env();
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
    });
  }
  return client;
}

function publicUrl(key) {
  const base = env().publicBaseUrl.replace(/\/+$/, '');
  return `${base}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function keyFromPublicUrl(value, uid) {
  try {
    const base = new URL(env().publicBaseUrl);
    const url = new URL(String(value || ''));
    const basePath = base.pathname.replace(/\/+$/, '');
    if (url.protocol !== 'https:' || url.origin !== base.origin || !url.pathname.startsWith(`${basePath}/`)) return null;
    const key = url.pathname.slice(basePath.length + 1).split('/').map(decodeURIComponent).join('/');
    return key.startsWith(`profiles/${uid}/`) ? key : null;
  } catch {
    return null;
  }
}

export async function createR2Upload({ uid, kind, fileName, contentType, size }) {
  const extension = (String(fileName || '').split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8) || 'bin';
  const key = `profiles/${uid}/${kind}-${randomUUID()}.${extension}`;
  const command = new PutObjectCommand({
    Bucket: env().bucket,
    Key: key,
    ContentType: contentType,
    ContentLength: size,
    CacheControl: 'public, max-age=31536000, immutable',
  });
  const uploadUrl = await getSignedUrl(getClient(), command, { expiresIn: 300 });
  return { provider: 'r2', uploadUrl, url: publicUrl(key), key };
}

export async function listR2Media(uid) {
  const result = await getClient().send(new ListObjectsV2Command({
    Bucket: env().bucket,
    Prefix: `profiles/${uid}/`,
    MaxKeys: 1000,
  }));
  return (result.Contents || []).filter((item) => item.Key).map((item) => ({
    pathname: item.Key,
    url: publicUrl(item.Key),
    size: item.Size || 0,
    uploadedAt: item.LastModified?.toISOString?.() || null,
  }));
}

export async function deleteR2Media(url, uid) {
  const key = keyFromPublicUrl(url, uid);
  if (!key) return false;
  await getClient().send(new DeleteObjectCommand({ Bucket: env().bucket, Key: key }));
  return true;
}
