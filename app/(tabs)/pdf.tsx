import { useState } from "react";
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePdfToSpeech } from "@/hooks/usePdfToSpeech";
import { PdfUploader } from "@/components/pdf/PdfUploader";
import { LanguagePicker } from "@/components/pdf/LanguagePicker";
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { DownloadButton } from "@/components/audio/DownloadButton";
import { SyncedTranscript } from "@/components/audio/SyncedTranscript";
import { OUTPUT_LANGUAGES } from "@/constants/languages";
import { theme } from "@/constants/theme";

export default function PdfToAudioScreen() {
  const insets = useSafeAreaInsets();
  const {
    status,
    error,
    audioUrls,
    audioUrl,
    transcriptText,
    synthesisProgress,
    isBackgroundSynthesizing,
    selectedFile,
    outputLanguage,
    setOutputLanguage,
    selectFile,
    run,
    reset,
  } = usePdfToSpeech();

  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const progress = durationMs > 0 ? positionMs / durationMs : 0;
  const isBusy =
    status === "extracting" ||
    (status === "synthesizing" && audioUrls.length === 0);
  const selectedLangLabel =
    OUTPUT_LANGUAGES.find((l) => l.code === outputLanguage)?.label ?? "English";

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + theme.spacing.lg },
      ]}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Sunai</Text>
        <Text style={styles.title}>PDF to Audio</Text>
        <Text style={styles.subtitle}>
          Pick a PDF, choose your speech language, then listen along with the
          transcript
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.stepLabel}>1. Select PDF</Text>
        <PdfUploader
          onFileSelected={selectFile}
          selectedFile={selectedFile}
          status={status}
          disabled={isBusy}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.stepLabel}>2. Choose speech language</Text>
        <LanguagePicker
          value={outputLanguage}
          onChange={setOutputLanguage}
          disabled={isBusy || status === "ready"}
        />
      </View>

      {status === "extracting" && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>Extracting text…</Text>
        </View>
      )}

      {status === "synthesizing" && audioUrls.length === 0 && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            Translating & preparing {selectedLangLabel} audio…
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {selectedFile && (status === "idle" || status === "error") && (
        <TouchableOpacity
          style={styles.convertButton}
          onPress={run}
          activeOpacity={0.8}
        >
          <Text style={styles.convertButtonText}>
            Convert to {selectedLangLabel} speech
          </Text>
        </TouchableOpacity>
      )}

      {audioUrls.length > 0 && (
        <View style={styles.resultSection}>
          <View style={styles.audioCard}>
            <Text style={styles.sectionTitle}>
              Now playing · {selectedLangLabel}
            </Text>
            <AudioPlayer
              audioUrls={audioUrls}
              expectMoreChunks={isBackgroundSynthesizing}
              onProgress={(pos, dur) => {
                setPositionMs(pos);
                setDurationMs(dur);
              }}
              onSeekStart={() => setScrollEnabled(false)}
              onSeekEnd={() => setScrollEnabled(true)}
            />
            {isBackgroundSynthesizing && synthesisProgress && (
              <Text style={styles.backgroundHint}>
                Loading more audio… ({synthesisProgress.ready}/
                {synthesisProgress.total} parts ready)
              </Text>
            )}
          </View>

          {transcriptText && (
            <SyncedTranscript text={transcriptText} progress={progress} />
          )}

          <View style={styles.downloadWrap}>
            <DownloadButton
              audioUrl={audioUrl}
              filename="pdf-speech.mp3"
              disabled={isBackgroundSynthesizing}
            />
          </View>
        </View>
      )}

      {(status === "ready" || status === "error") && (
        <TouchableOpacity
          style={styles.resetButton}
          onPress={reset}
          activeOpacity={0.8}
        >
          <Text style={styles.resetButtonText}>Start over</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    letterSpacing: 0.2,
  },
  statusCard: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  errorBox: {
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: "#fef2f2",
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
  },
  convertButton: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: "center",
    minHeight: theme.minTouchTarget,
    justifyContent: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  resultSection: {
    marginTop: theme.spacing.xl,
    width: "100%",
  },
  audioCard: {
    marginBottom: theme.spacing.sm,
  },
  backgroundHint: {
    marginTop: theme.spacing.sm,
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  downloadWrap: {
    marginTop: theme.spacing.lg,
  },
  resetButton: {
    marginTop: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    alignItems: "center",
  },
  resetButtonText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
});
