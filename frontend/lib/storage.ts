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

/** Read a video file's duration + orientation in the browser. */
export function readVideoMeta(
  file: File
): Promise<{ duration: number | null; isVertical: boolean }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("video")) return resolve({ duration: null, isVertical: false });
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const isVertical = v.videoHeight > v.videoWidth && v.videoWidth > 0;
      resolve({ duration: Math.round(v.duration) || null, isVertical });
      URL.revokeObjectURL(v.src);
    };
    v.onerror = () => resolve({ duration: null, isVertical: false });
    v.src = URL.createObjectURL(file);
  });
}

// Capture a single frame from a video File and return it as a JPEG Blob.
export async function captureVideoFrame(file: File, atSec = 1): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.muted = true;
      v.playsInline = true;
      v.src = url;
      v.onloadedmetadata = () => { v.currentTime = Math.min(atSec, (v.duration || 2) / 2); };
      v.onseeked = () => {
        try {
          const c = document.createElement("canvas");
          c.width = v.videoWidth || 720;
          c.height = v.videoHeight || 1280;
          const ctx = c.getContext("2d");
          if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
          ctx.drawImage(v, 0, 0, c.width, c.height);
          c.toBlob((b) => { URL.revokeObjectURL(url); resolve(b); }, "image/jpeg", 0.85);
        } catch { URL.revokeObjectURL(url); resolve(null); }
      };
      v.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    } catch { resolve(null); }
  });
}
