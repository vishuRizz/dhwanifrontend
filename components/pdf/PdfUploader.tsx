import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { theme } from "@/constants/theme";

interface PdfUploaderProps {
  onFileSelected: (file: { uri: string; name: string; type?: string }) => void;
  selectedFile: { name: string; uri: string } | null;
  status: "idle" | "extracting" | "synthesizing" | "ready" | "error";
  disabled?: boolean;
}

export function PdfUploader({
  onFileSelected,
  selectedFile,
  status,
  disabled = false,
}: PdfUploaderProps) {
  const isBusy = status === "extracting" || status === "synthesizing";

  const pickDocument = async () => {
    if (isBusy || disabled) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets[0];
      onFileSelected({
        uri: file.uri,
        name: file.name ?? "document.pdf",
        type: file.mimeType ?? "application/pdf",
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.card, isBusy && styles.cardDisabled]}
        onPress={pickDocument}
        disabled={isBusy || disabled}
        activeOpacity={0.7}
      >
        {isBusy ? (
          <ActivityIndicator size="large" color={theme.colors.primary} />
        ) : (
          <>
            <Text style={styles.icon}>📄</Text>
            <Text style={styles.label}>
              {selectedFile ? selectedFile.name : "Tap to select PDF"}
            </Text>
            {selectedFile && (
              <Text style={styles.hint}>Tap again to change file</Text>
            )}
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: theme.minTouchTarget * 2,
  },
  cardDisabled: {
    opacity: 0.8,
  },
  icon: {
    fontSize: 40,
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    textAlign: "center",
  },
  hint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
});

