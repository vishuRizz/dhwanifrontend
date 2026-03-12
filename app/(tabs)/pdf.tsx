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
import { AudioPlayer } from "@/components/audio/AudioPlayer";
import { DownloadButton } from "@/components/audio/DownloadButton";
import { SyncedTranscript } from "@/components/audio/SyncedTranscript";
import { theme } from "@/constants/theme";

export default function PdfToAudioScreen() {
  const insets = useSafeAreaInsets();
  const {
    status,
    error,
    audioUrl,
    transcriptText,
    selectedFile,
    selectFile,
    run,
    reset,
  } = usePdfToSpeech();

  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + theme.spacing.lg }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>PDF to Audio</Text>
        <Text style={styles.subtitle}>
          Select a PDF, convert to speech, and follow along with the transcript
        </Text>
      </View>

      <View style={styles.uploadCard}>
        <PdfUploader
          onFileSelected={selectFile}
          selectedFile={selectedFile}
          status={status}
          disabled={status === "extracting" || status === "synthesizing"}
        />
      </View>

      {(status === "extracting" || status === "synthesizing") && (
        <View style={styles.statusCard}>
          <Text style={styles.statusText}>
            {status === "extracting" ? "Extracting text…" : "Preparing audio…"}
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
          <Text style={styles.convertButtonText}>Convert to speech</Text>
        </TouchableOpacity>
      )}

      {audioUrl && (
        <View style={styles.resultSection}>
          <View style={styles.audioCard}>
            <Text style={styles.sectionTitle}>Now playing</Text>
            <AudioPlayer
              audioUrl={audioUrl}
              onProgress={(pos, dur) => {
                setPositionMs(pos);
                setDurationMs(dur);
              }}
            />
          </View>

          {transcriptText && (
            <SyncedTranscript text={transcriptText} progress={progress} />
          )}

          <View style={styles.downloadWrap}>
            <DownloadButton audioUrl={audioUrl} filename="pdf-speech.mp3" />
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
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  uploadCard: {
    marginBottom: theme.spacing.md,
  },
  statusCard: {
    marginTop: theme.spacing.sm,
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
    marginTop: theme.spacing.sm,
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
    marginTop: theme.spacing.md,
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

