import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { theme } from "@/constants/theme";

const LINE_HEIGHT = 28;
const LINE_PADDING = 8;
const LINE_TOTAL = LINE_HEIGHT + LINE_PADDING;
const SCROLL_VIEW_HEIGHT = 240;

interface SyncedTranscriptProps {
  text: string | null;
  progress: number; // 0–1
}

function splitIntoLines(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const byNewline = trimmed.split(/\n+/).filter(Boolean);
  if (byNewline.length > 1) return byNewline;
  const bySentence = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
  return bySentence.length > 0 ? bySentence : [trimmed];
}

export function SyncedTranscript({ text, progress }: SyncedTranscriptProps) {
  const scrollRef = useRef<ScrollView>(null);
  const lines = text ? splitIntoLines(text) : [];
  const currentIndex =
    lines.length > 0
      ? Math.min(Math.floor(progress * lines.length), lines.length - 1)
      : 0;

  useEffect(() => {
    if (lines.length === 0) return;
    const contentHeight = lines.length * LINE_TOTAL;
    const halfView = SCROLL_VIEW_HEIGHT / 2;
    const lineCenter = currentIndex * LINE_TOTAL + LINE_TOTAL / 2;
    const y = lineCenter - halfView;
    const clampedY = Math.max(0, Math.min(y, contentHeight - SCROLL_VIEW_HEIGHT));
    scrollRef.current?.scrollTo({
      y: clampedY,
      animated: true,
    });
  }, [currentIndex, lines.length]);

  if (!text || lines.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transcript</Text>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={false}
      >
        {lines.map((line, i) => {
          const isCurrent = i === currentIndex;
          const isPast = i < currentIndex;
          return (
            <View
              key={`${i}-${line.slice(0, 20)}`}
              style={[styles.lineWrap, isCurrent && styles.lineWrapCurrent]}
            >
              <Text
                style={[
                  styles.line,
                  isCurrent && styles.lineCurrent,
                  isPast && styles.linePast,
                ]}
              >
                {line}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: theme.spacing.lg,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  scroll: {
    height: SCROLL_VIEW_HEIGHT,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollContent: {
    paddingVertical: theme.spacing.sm,
    paddingBottom: theme.spacing.xl,
  },
  lineWrap: {
    minHeight: LINE_TOTAL,
    justifyContent: "center",
    paddingVertical: LINE_PADDING / 2,
  },
  lineWrapCurrent: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    marginHorizontal: -theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
  },
  line: {
    fontSize: 15,
    lineHeight: LINE_HEIGHT,
    color: theme.colors.text,
  },
  lineCurrent: {
    fontWeight: "600",
    color: theme.colors.primary,
  },
  linePast: {
    color: theme.colors.textSecondary,
    opacity: 0.85,
  },
});

