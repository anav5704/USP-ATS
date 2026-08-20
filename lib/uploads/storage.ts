import { mkdir, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { isSafeStoredName } from "@/lib/profile/upload";

export const UPLOADS_ROOT = path.join(process.cwd(), "uploads");

export function userUploadDir(userId: string) {
  return path.join(UPLOADS_ROOT, "profiles", userId);
}

export function storedFilePath(userId: string, storedName: string) {
  return path.join(userUploadDir(userId), storedName);
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
  const dir = userUploadDir(userId);
  await mkdir(dir, { recursive: true });
  await writeFile(storedFilePath(userId, storedName), buffer);
}

export async function deleteStoredFile(userId: string, storedName: string) {
  if (!isSafeStoredName(storedName)) return;
  try {
    await unlink(storedFilePath(userId, storedName));
  } catch {
    // file already gone
  }
}

export async function readStoredFile(userId: string, storedName: string) {
  if (!isSafeStoredName(storedName)) return null;
  const filePath = storedFilePath(userId, storedName);
  try {
    return await import("node:fs/promises").then(({ readFile }) =>
      readFile(filePath)
    );
  } catch {
    return null;
  }
}

export async function listStoredFiles(userId: string): Promise<string[]> {
  try {
    const entries = await readdir(userUploadDir(userId));
    return entries.filter(isSafeStoredName);
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