import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@dhwani/audioHistory";

export interface SavedAudio {
  id: string;
  url: string;
  path: string;
  fileName: string;
  transcriptPreview?: string | null;
  createdAt: string; // ISO string
}

async function readHistory(): Promise<SavedAudio[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as SavedAudio[];
  } catch {
    return [];
  }
}

async function writeHistory(items: SavedAudio[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function getSavedAudioHistory(): Promise<SavedAudio[]> {
  return readHistory();
}

export async function addSavedAudioToHistory(entry: {
  url: string;
  path: string;
  fileName: string;
  transcriptPreview?: string | null;
}): Promise<SavedAudio[]> {
  const items = await readHistory();
  const now = new Date().toISOString();
  const record: SavedAudio = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: now,
    ...entry,
  };
  const next = [record, ...items].slice(0, 50); // cap history
  await writeHistory(next);
  return next;
}

export async function clearSavedAudioHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

