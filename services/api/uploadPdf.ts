const getBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export interface UploadPdfResult {
  text: string;
  chunks: string[];
  chunkSize: number;
  /** True when text came from Google Vision OCR (scanned PDF). */
  usedOcr?: boolean;
}

export async function uploadPdf(file: {
  uri: string;
  name: string;
  type?: string;
}): Promise<UploadPdfResult> {
  const baseUrl = getBaseUrl();
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    name: file.name ?? "document.pdf",
    type: file.type ?? "application/pdf",
  } as unknown as Blob);

  const response = await fetch(`${baseUrl}/api/pdf/upload`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ??
        `Upload failed: ${response.status}`
    );
  }

  return response.json() as Promise<UploadPdfResult>;
}

