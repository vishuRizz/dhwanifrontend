const getBaseUrl = () =>
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export interface AudioHistoryItem {
  name: string;
  path: string;
  url: string;
  createdAt: string | null;
}

export async function fetchAudioHistory(): Promise<AudioHistoryItem[]> {
  const baseUrl = getBaseUrl();
  const response = await fetch(`${baseUrl}/api/tts/history`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: string }).error ??
        `History fetch failed: ${response.status}`
    );
  }

  const body = (await response.json()) as { items: AudioHistoryItem[] };
  return body.items ?? [];
}

