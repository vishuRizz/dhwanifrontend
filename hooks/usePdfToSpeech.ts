import { useState, useCallback, useRef } from "react";
import { uploadPdf } from "@/services/api/uploadPdf";
import { synthesizeTts } from "@/services/api/synthesizeTts";
import {
  DEFAULT_OUTPUT_LANGUAGE,
  type OutputLanguageCode,
} from "@/constants/languages";

export type PdfToSpeechStatus =
  | "idle"
  | "extracting"
  | "synthesizing"
  | "ready"
  | "error";

export interface SynthesisProgress {
  ready: number;
  total: number;
}

export interface UsePdfToSpeechResult {
  status: PdfToSpeechStatus;
  error: string | null;
  /** Grows as each audio chunk is synthesized (chunk 1 first). */
  audioUrls: string[];
  /** @deprecated Use audioUrls[0] */
  audioUrl: string | null;
  transcriptText: string | null;
  synthesisProgress: SynthesisProgress | null;
  isBackgroundSynthesizing: boolean;
  selectedFile: { name: string; uri: string } | null;
  outputLanguage: OutputLanguageCode;
  setOutputLanguage: (code: OutputLanguageCode) => void;
  selectFile: (file: { uri: string; name: string; type?: string } | null) => void;
  run: () => Promise<void>;
  reset: () => void;
}

export function usePdfToSpeech(): UsePdfToSpeechResult {
  const [status, setStatus] = useState<PdfToSpeechStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [synthesisProgress, setSynthesisProgress] = useState<SynthesisProgress | null>(null);
  const [selectedFile, setSelectedFile] = useState<{ name: string; uri: string } | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<OutputLanguageCode>(
    DEFAULT_OUTPUT_LANGUAGE
  );
  const cancelledRef = useRef(false);

  const selectFile = useCallback((file: { uri: string; name: string; type?: string } | null) => {
    setSelectedFile(file ? { name: file.name, uri: file.uri } : null);
    setError(null);
  }, []);

  const run = useCallback(async () => {
    if (!selectedFile) return;
    cancelledRef.current = false;
    setError(null);
    setAudioUrls([]);
    setSynthesisProgress(null);
    setStatus("extracting");

    try {
      const { text, chunks } = await uploadPdf({
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: "application/pdf",
      });
      if (cancelledRef.current) return;

      if (!chunks?.length) {
        throw new Error("No text could be extracted from the PDF");
      }

      const total = chunks.length;
      const fullText = text ?? chunks.join(" ");
      setTranscriptText(fullText);
      setSynthesisProgress({ ready: 0, total });
      setStatus("synthesizing");

      const ttsOpts = {
        languageCode: outputLanguage,
        detectFromText: fullText,
      };
      const first = await synthesizeTts({ chunks: [chunks[0]], ...ttsOpts });
      if (cancelledRef.current) return;

      const spokenParts: string[] = [];
      if (first.spokenText?.trim()) {
        spokenParts.push(first.spokenText.trim());
        setTranscriptText(spokenParts.join("\n\n"));
      }

      setAudioUrls([first.audioUrl]);
      setSynthesisProgress({ ready: 1, total });
      setStatus("ready");

      if (total <= 1) return;

      const urls = [first.audioUrl];
      for (let i = 1; i < total; i++) {
        if (cancelledRef.current) return;
        try {
          const result = await synthesizeTts({
            chunks: [chunks[i]],
            ...ttsOpts,
          });
          if (cancelledRef.current) return;
          if (result.spokenText?.trim()) {
            spokenParts.push(result.spokenText.trim());
            setTranscriptText(spokenParts.join("\n\n"));
          }
          urls.push(result.audioUrl);
          setAudioUrls([...urls]);
          setSynthesisProgress({ ready: i + 1, total });
        } catch (chunkErr) {
          console.error(`Chunk ${i + 1}/${total} synthesis failed:`, chunkErr);
          setError(
            chunkErr instanceof Error
              ? chunkErr.message
              : `Failed to prepare part ${i + 1} of ${total}`
          );
          break;
        }
      }
    } catch (e) {
      if (!cancelledRef.current) {
        setError(e instanceof Error ? e.message : "Something went wrong");
        setStatus("error");
      }
    }
  }, [selectedFile, outputLanguage]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setStatus("idle");
    setError(null);
    setAudioUrls([]);
    setTranscriptText(null);
    setSynthesisProgress(null);
    setSelectedFile(null);
  }, []);

  const isBackgroundSynthesizing =
    synthesisProgress != null &&
    synthesisProgress.ready < synthesisProgress.total &&
    audioUrls.length > 0;

  return {
    status,
    error,
    audioUrls,
    audioUrl: audioUrls[0] ?? null,
    transcriptText,
    synthesisProgress,
    isBackgroundSynthesizing,
    selectedFile,
    outputLanguage,
    setOutputLanguage,
    selectFile,
    run,
    reset,
  };
}
