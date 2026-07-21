export type OutputLanguageCode =
  | "en-IN"
  | "hi-IN"
  | "mr-IN"
  | "ta-IN"
  | "te-IN";

export interface OutputLanguage {
  code: OutputLanguageCode;
  label: string;
  nativeLabel: string;
}

/** Top Indian languages for speech output (Google Cloud TTS WaveNet). */
export const OUTPUT_LANGUAGES: OutputLanguage[] = [
  { code: "en-IN", label: "English", nativeLabel: "English" },
  { code: "hi-IN", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "mr-IN", label: "Marathi", nativeLabel: "मराठी" },
  { code: "ta-IN", label: "Tamil", nativeLabel: "தமிழ்" },
  { code: "te-IN", label: "Telugu", nativeLabel: "తెలుగు" },
];

export const DEFAULT_OUTPUT_LANGUAGE: OutputLanguageCode = "en-IN";
