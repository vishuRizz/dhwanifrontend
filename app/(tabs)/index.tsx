import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from "react-native";
import { Link } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@/constants/theme";

const FEATURES = [
  {
    icon: "📄",
    title: "PDF to Audio",
    desc: "Upload any PDF and hear it spoken aloud with a synced live transcript.",
    href: "/(tabs)/pdf" as const,
  },
];

const HOW_IT_WORKS = [
  { step: "1", text: "Tap PDF to Audio in the tab bar below" },
  { step: "2", text: "Select a PDF from your files" },
  { step: "3", text: "Tap Convert — we extract the text and generate speech" },
  { step: "4", text: "Play, pause, seek, and follow the synced transcript" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.logoWrap}>
          <Text style={styles.logoIcon}>🎧</Text>
        </View>
        <Text style={styles.appName}>Dhwani</Text>
        <Text style={styles.tagline}>Listen. Read. Access.</Text>
        <Text style={styles.heroDesc}>
          An accessibility app that turns written content into clear, natural
          speech — designed for the blind and low-vision community.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>What you can do</Text>
        {FEATURES.map((f) => (
          <Link key={f.title} href={f.href} asChild>
            <TouchableOpacity style={styles.featureCard} activeOpacity={0.8}>
              <View style={styles.featureLeft}>
                <Text style={styles.featureIcon}>{f.icon}</Text>
              </View>
              <View style={styles.featureBody}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
              <Text style={styles.featureArrow}>›</Text>
            </TouchableOpacity>
          </Link>
        ))}
      </View>

      {/* How it works */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>How it works</Text>
        <View style={styles.stepsCard}>
          {HOW_IT_WORKS.map((item, i) => (
            <View key={item.step} style={[styles.step, i > 0 && styles.stepBorder]}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{item.step}</Text>
              </View>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <Link href="/(tabs)/pdf" asChild>
        <TouchableOpacity style={styles.cta} activeOpacity={0.85}>
          <Text style={styles.ctaText}>Get started →</Text>
        </TouchableOpacity>
      </Link>
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
  hero: {
    alignItems: "center",
    marginBottom: theme.spacing.xl + 8,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.lg,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 36,
  },
  appName: {
    fontSize: 38,
    fontWeight: "800",
    color: theme.colors.text,
    letterSpacing: -1,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  heroDesc: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight: 23,
    maxWidth: 320,
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
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: theme.spacing.md,
  },
  featureLeft: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: `${theme.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  featureIcon: {
    fontSize: 22,
  },
  featureBody: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 3,
  },
  featureDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 19,
  },
  featureArrow: {
    fontSize: 22,
    color: theme.colors.textSecondary,
    fontWeight: "300",
  },
  stepsCard: {
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
  step: {
    flexDirection: "row",
    alignItems: "center",
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  stepBorder: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  cta: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.lg,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },
});
