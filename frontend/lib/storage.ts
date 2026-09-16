import { api } from "./api";

interface SignResponse {
  method: string;
  upload_url: string;
  headers: Record<string, string>;
  public_url: string;
}

/**
 * Upload a file to whatever storage the backend is configured for
 * (Supabase now, B2/R2 later) and return its public URL.
 * Provider-agnostic: the browser just PUTs to the signed URL it's handed.
 */
export async function uploadFile(
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const sign = await api<SignResponse>("/api/uploads/sign", {
    method: "POST",
    json: { filename: file.name, content_type: file.type || "application/octet-stream" },
  });

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(sign.method, sign.upload_url);
    Object.entries(sign.headers || {}).forEach(([k, v]) => xhr.setRequestHeader(k, v));
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });

  return sign.public_url;
}

/** Read a video file's duration (seconds) in the browser. */
export function readVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("video")) return resolve(null);
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      resolve(Math.round(v.duration) || null);
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => resolve(null);
    v.src = URL.createObjectURL(file);
  });
}
