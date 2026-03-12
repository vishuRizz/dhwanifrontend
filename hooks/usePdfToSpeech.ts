import { useState, useCallback } from "react";
import { uploadPdf } from "@/services/api/uploadPdf";
import { synthesizeTts } from "@/services/api/synthesizeTts";

export type PdfToSpeechStatus =
  | "idle"
  | "extracting"
  | "synthesizing"
  | "ready"
  | "error";

export interface UsePdfToSpeechResult {
  status: PdfToSpeechStatus;
  error: string | null;
  audioUrl: string | null;
  transcriptText: string | null;
  selectedFile: { name: string; uri: string } | null;
  selectFile: (file: { uri: string; name: string; type?: string } | null) => void;
  run: () => Promise<void>;
  reset: () => void;
}

export function usePdfToSpeech(): UsePdfToSpeechResult {
  const [status, setStatus] = useState<PdfToSpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);

  const selectFile = useCallback((file: { uri: string; name: string; type?: string } | null) => {
    setSelectedFile(file ? { name: file.name, uri: file.uri } : null);
    setError(null);
  }, []);

  const run = useCallback(async () => {
    if (!selectedFile) return;
    setError(null);
    setAudioUrl(null);
    setStatus("extracting");

    try {
      const { text, chunks } = await uploadPdf({
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: "application/pdf",
      });
      setTranscriptText(text ?? null);
      setStatus("synthesizing");
      const { audioUrl: url } = await synthesizeTts({ chunks });
      setAudioUrl(url);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setStatus("error");
    }
  }, [selectedFile]);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setAudioUrl(null);
    setTranscriptText(null);
    setSelectedFile(null);
  }, []);

  return { status, error, audioUrl, transcriptText, selectedFile, selectFile, run, reset };
}

