import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { theme } from "@/constants/theme";

interface DownloadButtonProps {
  audioUrl: string | null;
  filename?: string;
  disabled?: boolean;
}

export function DownloadButton({
  audioUrl,
  filename = "speech.mp3",
  disabled = false,
}: DownloadButtonProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!audioUrl || disabled || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!dir) throw new Error("No storage directory");
      const safeName = filename.replace(/[^\w.-]/g, "_");
      const path = `${dir}${Date.now()}-${safeName}`;
      await FileSystem.downloadAsync(audioUrl, path);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(path, {
          mimeType: "audio/mpeg",
          dialogTitle: "Save audio",
        });
      }
      setSaved(true);
    } catch (e) {
      console.error("Save audio failed:", e);
    } finally {
      setSaving(false);
    }
  };

  if (!audioUrl) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, (disabled || saving) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={disabled || saving}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>💾</Text>
        <Text style={styles.label}>
          {saving ? "Saving…" : saved ? "Saved" : "Save audio"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.md,
    minHeight: theme.minTouchTarget,
    gap: theme.spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

