const getBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export interface SynthesizeTtsResult {
  audioUrl: string;
}

export async function synthesizeTts(params: {
  text?: string;
  chunks?: string[];
}): Promise<SynthesizeTtsResult> {
  const baseUrl = getBaseUrl();
  const body =
    params.chunks?.length && params.chunks.length > 0
      ? { chunks: params.chunks }
      : params.text
      ? { text: params.text }
      : null;

  if (!body) {
    throw new Error("Provide text or chunks");
  }

  const response = await fetch(`${baseUrl}/api/tts/synthesize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ??
        `TTS failed: ${response.status}`
    );
  }

  return response.json() as Promise<SynthesizeTtsResult>;
}

