import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { isSafeStoredName } from "@/lib/profile/upload";
import { R2_BUCKET, R2_PUBLIC_URL, r2 } from "./r2";

function objectKey(userId: string, storedName: string) {
  return `profiles/${userId}/${storedName}`;
}

export function getPublicUrl(userId: string, storedName: string) {
  return `${R2_PUBLIC_URL}/${objectKey(userId, storedName)}`;
}

export async function saveUploadFile({
  userId,
  storedName,
  buffer,
}: {
  userId: string;
  storedName: string;
  buffer: Uint8Array;
}) {
  if (!isSafeStoredName(storedName)) {
    throw new Error("Invalid stored file name");
  }
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey(userId, storedName),
      Body: buffer,
    })
  );
}

export async function deleteStoredFile(userId: string, storedName: string) {
  if (!isSafeStoredName(storedName)) return;
  await r2.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: objectKey(userId, storedName),
    })
  );
}

export async function readStoredFile(userId: string, storedName: string) {
  if (!isSafeStoredName(storedName)) return null;
  try {
    const res = await r2.send(
      new GetObjectCommand({
        Bucket: R2_BUCKET,
        Key: objectKey(userId, storedName),
      })
    );
    return res.Body;
  } catch {
    return null;
  }
}

export async function listStoredFiles(userId: string): Promise<string[]> {
  try {
    const res = await r2.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: `profiles/${userId}/`,
      })
    );
    return (res.Contents ?? [])
      .map((obj) => {
        const key = obj.Key ?? "";
        const name = key.split("/").pop() ?? "";
        return name;
      })
      .filter(isSafeStoredName);
  } catch {
    return [];
  }
}

export async function pruneStoredFiles(userId: string, keep: Set<string>) {
  const existing = await listStoredFiles(userId);
  await Promise.all(
    existing
      .filter((name) => !keep.has(name))
      .map((name) => deleteStoredFile(userId, name))
  );
}

export async function deleteRemovedStoredFiles(
  userId: string,
  storedNames: string[]
) {
  await Promise.all(
    storedNames.map((storedName) => deleteStoredFile(userId, storedName))
  );
}
