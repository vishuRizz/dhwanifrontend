const getBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

const normalizeAudioUrl = (rawUrl: string, baseUrl: string) => {
  const value = rawUrl.trim();
  if (!value) {
    throw new Error("TTS response did not include a valid audio URL");
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("file://") ||
    value.startsWith("data:")
  ) {
    return value;
  }

  try {
    return new URL(value, `${baseUrl.replace(/\/+$/, "")}/`).toString();
  } catch {
    throw new Error(`Invalid audio URL returned by API: ${value}`);
  }
};

export interface SynthesizeTtsResult {
  audioUrl: string;
  path: string;
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

  const data = (await response.json()) as SynthesizeTtsResult;
  return {
    ...data,
    audioUrl: normalizeAudioUrl(data.audioUrl, baseUrl),
  };
}

