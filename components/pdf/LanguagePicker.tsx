import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  OUTPUT_LANGUAGES,
  type OutputLanguageCode,
} from "@/constants/languages";
import { theme } from "@/constants/theme";

interface LanguagePickerProps {
  value: OutputLanguageCode;
  onChange: (code: OutputLanguageCode) => void;
  disabled?: boolean;
}

export function LanguagePicker({
  value,
  onChange,
  disabled = false,
}: LanguagePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Output speech language</Text>
      <Text style={styles.subtitle}>
        PDF can be in any language — audio will be spoken in your selection
      </Text>
      <View style={styles.row}>
        {OUTPUT_LANGUAGES.map((lang) => {
          const selected = value === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.chip,
                selected && styles.chipSelected,
                disabled && styles.chipDisabled,
              ]}
              onPress={() => onChange(lang.code)}
              disabled={disabled}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text
                style={[styles.chipNative, selected && styles.chipTextSelected]}
              >
                {lang.nativeLabel}
              </Text>
              <Text
                style={[styles.chipLabel, selected && styles.chipTextSelected]}
              >
                {lang.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  chip: {
    minWidth: "30%",
    flexGrow: 1,
    paddingVertical: theme.spacing.sm + 2,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    minHeight: theme.minTouchTarget,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipNative: {
    fontSize: 15,
    fontWeight: "700",
    color: theme.colors.text,
  },
  chipLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  chipTextSelected: {
    color: "#fff",
  },
});
