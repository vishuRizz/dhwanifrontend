import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Audio } from "expo-av";
import Slider from "@react-native-community/slider";
import { theme } from "@/constants/theme";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface AudioPlayerProps {
  audioUrl: string | null;
  onProgress?: (positionMs: number, durationMs: number) => void;
}

export function AudioPlayer({ audioUrl, onProgress }: AudioPlayerProps) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const isSeekingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.warn("Audio mode:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const loadSound = async (url: string) => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    setIsLoading(true);
    setPositionMs(0);
    setDurationMs(0);
    setIsPlaying(false);
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: false, progressUpdateIntervalMillis: 250 },
        (status) => {
          if (!status.isLoaded) return;
          const pos = status.positionMillis ?? 0;
          if (!isSeekingRef.current) setPositionMs(pos);
          if (status.durationMillis != null) setDurationMs(status.durationMillis);
          setIsPlaying(status.isPlaying ?? false);
          onProgress?.(pos, status.durationMillis ?? 0);
        }
      );
      soundRef.current = sound;
      const st = await sound.getStatusAsync();
      if (st.isLoaded && st.durationMillis != null) setDurationMs(st.durationMillis);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!audioUrl) {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
      setPositionMs(0);
      setDurationMs(0);
      setIsPlaying(false);
      return;
    }
    loadSound(audioUrl);
    return () => {
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, [audioUrl]);

  const togglePlayPause = async () => {
    const s = soundRef.current;
    if (!s || isLoading) return;
    const st = await s.getStatusAsync();
    if (!st.isLoaded) return;
    try {
      if (st.isPlaying) {
        await s.pauseAsync();
      } else {
        await s.playAsync();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSlidingStart = () => {
    isSeekingRef.current = true;
    setIsSeeking(true);
    setSliderValue(positionMs);
  };

  const handleSlidingComplete = async (value: number) => {
    const ms = Math.round(value);
    setPositionMs(ms);
    setSliderValue(ms);
    isSeekingRef.current = false;
    setIsSeeking(false);
    const s = soundRef.current;
    if (s) {
      try {
        await s.setPositionAsync(ms);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSpeed = async (rate: number) => {
    setPlaybackRate(rate);
    const s = soundRef.current;
    if (!s) return;
    try {
      await s.setRateAsync(rate, true);
    } catch (e) {
      console.error(e);
    }
  };

  if (!audioUrl) return null;

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  const displayPosition = isSeeking ? sliderValue : positionMs;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Play / Pause */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={togglePlayPause}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.playIcon}>{isPlaying ? "⏸" : "▶"}</Text>
          )}
        </TouchableOpacity>

        {/* Seek slider */}
        <View style={styles.sliderRow}>
          <Text style={styles.timeLabel}>{formatMs(displayPosition)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={durationMs || 1}
            value={displayPosition}
            onSlidingStart={handleSlidingStart}
            onValueChange={(v) => setSliderValue(v)}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
          />
          <Text style={styles.timeLabel}>{formatMs(durationMs)}</Text>
        </View>

        {/* Speed */}
        <View style={styles.speedRow}>
          <Text style={styles.speedLabel}>Speed</Text>
          <View style={styles.speedChips}>
            {SPEED_OPTIONS.map((rate) => (
              <TouchableOpacity
                key={rate}
                style={[
                  styles.speedChip,
                  playbackRate === rate && styles.speedChipActive,
                ]}
                onPress={() => handleSpeed(rate)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.speedChipText,
                    playbackRate === rate && styles.speedChipTextActive,
                  ]}
                >
                  {rate === 1 ? "1x" : `${rate}x`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: theme.spacing.lg,
  },
  playIcon: {
    fontSize: 28,
    color: "#fff",
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  timeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    minWidth: 36,
    textAlign: "center",
  },
  speedRow: {
    marginTop: theme.spacing.sm,
  },
  speedLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  speedChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.xs,
  },
  speedChip: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  speedChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  speedChipText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  speedChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
});

