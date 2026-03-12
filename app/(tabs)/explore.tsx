import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";
import {
  fetchAudioHistory,
  AudioHistoryItem,
} from "@/services/api/audioHistory";

const INFO_ROWS = [
  { label: "App name", value: "Sunai" },
  { label: "Version", value: "1.0.0" },
  { label: "Backend", value: "Next.js + Google TTS" },
  { label: "Storage", value: "Supabase" },
];

const LINKS = [
  {
    icon: "🌐",
    title: "Google Cloud TTS",
    subtitle: "Powered by neural voices",
    url: "https://cloud.google.com/text-to-speech",
  },
  {
    icon: "🗄️",
    title: "Supabase",
    subtitle: "Audio file storage",
    url: "https://supabase.com",
  },
];

const ACCESSIBILITY_TIPS = [
  "Use your phone's screen reader (VoiceOver on iOS, TalkBack on Android) for full accessibility.",
  "All interactive elements have accessibility labels for screen readers.",
  "Increase text size in your phone's Display settings for larger transcript text.",
  "Use headphones for the best audio experience.",
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const [history, setHistory] = useState<AudioHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const items = await fetchAudioHistory();
        setHistory(items);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Could not load saved audios"
        );
      } finally {
        setLoadingHistory(false);
      }
    })();
  }, []);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appIcon}>🎧</Text>
        <Text style={styles.title}>Your profile</Text>
        <Text style={styles.subtitle}>
          An accessibility-first app that converts written PDFs into natural
          audio, helping the blind and low-vision community access information
          freely.
        </Text>
      </View>

      {/* Saved audio history */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Saved audios</Text>
        {loadingHistory ? (
          <Text style={styles.mutedText}>Loading…</Text>
        ) : error ? (
          <Text style={styles.mutedText}>{error}</Text>
        ) : history.length === 0 ? (
          <Text style={styles.mutedText}>
            When you convert a PDF to speech, it will appear here.
          </Text>
        ) : (
          <View style={styles.historyCard}>
            {history.map((item, index) => (
              <TouchableOpacity
                key={item.path}
                style={[styles.historyRow, index > 0 && styles.historyRowBorder]}
                onPress={() => Linking.openURL(item.url)}
                activeOpacity={0.7}
              >
                <View style={styles.historyAvatar}>
                  <Text style={styles.historyAvatarText}>▶</Text>
                </View>
                <View style={styles.historyBody}>
                  <Text style={styles.historyTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.historyMeta}>
                    {item.createdAt
                      ? new Date(item.createdAt).toLocaleString()
                      : "Time unknown"}
                  </Text>
                </View>
                <Text style={styles.historyArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* App info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About app</Text>
        <View style={styles.infoCard}>
          {INFO_ROWS.map((row, i) => (
            <View
              key={row.label}
              style={[styles.infoRow, i > 0 && styles.infoRowBorder]}
            >
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Accessibility tips */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Accessibility tips</Text>
        <View style={styles.tipsCard}>
          {ACCESSIBILITY_TIPS.map((tip, i) => (
            <View
              key={i}
              style={[styles.tip, i > 0 && styles.tipBorder]}
            >
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Powered by */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Powered by</Text>
        <View style={styles.linksCard}>
          {LINKS.map((link, i) => (
            <TouchableOpacity
              key={link.title}
              style={[styles.linkRow, i > 0 && styles.linkRowBorder]}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.7}
            >
              <Text style={styles.linkIcon}>{link.icon}</Text>
              <View style={styles.linkBody}>
                <Text style={styles.linkTitle}>{link.title}</Text>
                <Text style={styles.linkSub}>{link.subtitle}</Text>
              </View>
              <Text style={styles.linkArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>
        Built with care for accessibility.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  container: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: 48,
  },
  header: {
    alignItems: "center",
    marginBottom: theme.spacing.xl + 4,
  },
  appIcon: {
    fontSize: 52,
    marginBottom: theme.spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: theme.colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  historyRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  historyAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  historyAvatarText: {
    fontSize: 16,
    color: theme.colors.primary,
  },
  historyBody: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 2,
  },
  historyPreview: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  historyArrow: {
    fontSize: 18,
    color: theme.colors.textSecondary,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
  infoRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  tipsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tip: {
    flexDirection: "row",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  tipBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  tipBullet: {
    fontSize: 16,
    color: theme.colors.primary,
    lineHeight: 22,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 20,
  },
  linksCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  linkRowBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  linkIcon: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  linkBody: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  linkSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  linkArrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
  },
  footer: {
    textAlign: "center",
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  mutedText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  clearButton: {
    marginTop: theme.spacing.sm,
    alignSelf: "flex-end",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
  },
  clearButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textDecorationLine: "underline",
  },
});
