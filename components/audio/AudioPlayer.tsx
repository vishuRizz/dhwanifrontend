import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Audio, AVPlaybackStatus } from "expo-av";
import Slider from "@react-native-community/slider";
import { theme } from "@/constants/theme";

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const PLAYBACK_VOLUME = 1.0;

interface AudioPlayerProps {
  audioUrl?: string | null;
  audioUrls?: string[];
  expectMoreChunks?: boolean;
  onProgress?: (positionMs: number, durationMs: number) => void;
  onSeekStart?: () => void;
  onSeekEnd?: () => void;
}

export function AudioPlayer({
  audioUrl,
  audioUrls,
  expectMoreChunks = false,
  onProgress,
  onSeekStart,
  onSeekEnd,
}: AudioPlayerProps) {
  const urls = useMemo(
    () => (audioUrls?.length ? audioUrls : audioUrl ? [audioUrl] : []),
    [audioUrls, audioUrl]
  );
  const urlsKey = urls.join("\x1f");

  const soundRef = useRef<Audio.Sound | null>(null);
  const isSeekingRef = useRef(false);
  const currentIndexRef = useRef(0);
  const urlsRef = useRef(urls);
  const chunkDurationsRef = useRef<number[]>([]);
  const waitingForNextRef = useRef(false);
  const playbackRateRef = useRef(1);
  const isPlayingRef = useRef(false);
  const expectMoreRef = useRef(expectMoreChunks);
  const onProgressRef = useRef(onProgress);
  const pendingPlayRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const loadedUrlRef = useRef<string | null>(null);
  const wasPlayingBeforeSeekRef = useRef(false);
  const seekGenerationRef = useRef(0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [chunkPositionMs, setChunkPositionMs] = useState(0);
  const [chunkDurations, setChunkDurations] = useState<number[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const [waitingForNext, setWaitingForNext] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  urlsRef.current = urls;
  currentIndexRef.current = currentIndex;
  chunkDurationsRef.current = chunkDurations;
  isPlayingRef.current = isPlaying;
  expectMoreRef.current = expectMoreChunks;
  onProgressRef.current = onProgress;

  const globalPositionMs =
    chunkDurations.slice(0, currentIndex).reduce((a, b) => a + b, 0) + chunkPositionMs;
  const totalDurationMs = chunkDurations.reduce((a, b) => a + b, 0);
  const sliderPosition = seekValue ?? globalPositionMs;
  const sliderMax = Math.max(totalDurationMs, 1);

  const setChunkDurationAt = useCallback((index: number, duration: number) => {
    setChunkDurations((prev) => {
      if (prev[index] === duration) return prev;
      const next = [...prev];
      next[index] = duration;
      chunkDurationsRef.current = next;
      return next;
    });
  }, []);

  const unloadSound = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    loadedUrlRef.current = null;
  }, []);

  const loadChunkAtRef = useRef<(index: number, shouldPlay: boolean) => Promise<boolean>>(
    async () => false
  );

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus, chunkIndex: number, generation: number) => {
      if (generation !== loadGenerationRef.current) return;
      if (!status.isLoaded) {
        if (status.error) {
          setLoadError(status.error);
        }
        return;
      }

      const pos = status.positionMillis ?? 0;
      if (!isSeekingRef.current) {
        setChunkPositionMs(pos);
      }
      if (status.durationMillis != null) {
        setChunkDurationAt(chunkIndex, status.durationMillis);
      }
      setIsPlaying(status.isPlaying ?? false);

      const durations = chunkDurationsRef.current;
      const globalPos =
        durations.slice(0, chunkIndex).reduce((a, b) => a + b, 0) + pos;
      const totalDur = durations.reduce((a, b) => a + b, 0);
      onProgressRef.current?.(globalPos, totalDur);

      if (status.didJustFinish && !isSeekingRef.current) {
        const nextIndex = chunkIndex + 1;
        if (nextIndex < urlsRef.current.length) {
          void loadChunkAtRef.current(nextIndex, true);
        } else if (expectMoreRef.current) {
          waitingForNextRef.current = true;
          setWaitingForNext(true);
        } else {
          setIsPlaying(false);
        }
      }
    },
    [setChunkDurationAt]
  );

  const loadChunkAt = useCallback(
    async (index: number, shouldPlay: boolean): Promise<boolean> => {
      const url = urlsRef.current[index];
      if (!url) return false;

      if (loadedUrlRef.current === url && soundRef.current) {
        setIsReady(true);
        setLoadError(null);
        if (shouldPlay) {
          await soundRef.current.playAsync().catch(console.error);
        }
        return true;
      }

      const generation = ++loadGenerationRef.current;
      await unloadSound();

      setIsLoading(true);
      setIsReady(false);
      setLoadError(null);
      setCurrentIndex(index);
      currentIndexRef.current = index;
      if (!isSeekingRef.current) {
        setChunkPositionMs(0);
      }
      waitingForNextRef.current = false;
      setWaitingForNext(false);

      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          {
            shouldPlay: shouldPlay || pendingPlayRef.current,
            volume: PLAYBACK_VOLUME,
            progressUpdateIntervalMillis: 200,
          },
          (status) => onPlaybackStatusUpdate(status, index, generation)
        );

        if (generation !== loadGenerationRef.current) {
          await sound.unloadAsync().catch(() => {});
          return false;
        }

        soundRef.current = sound;
        loadedUrlRef.current = url;
        await sound.setVolumeAsync(PLAYBACK_VOLUME);
        if (playbackRateRef.current !== 1) {
          await sound.setRateAsync(playbackRateRef.current, true);
        }

        const st = await sound.getStatusAsync();
        if (st.isLoaded) {
          setIsReady(true);
          if (st.durationMillis != null) {
            setChunkDurationAt(index, st.durationMillis);
          }
          if (pendingPlayRef.current || shouldPlay) {
            pendingPlayRef.current = false;
            if (!st.isPlaying) {
              await sound.playAsync();
            }
          }
        }
        return true;
      } catch (e) {
        console.error("Audio load failed:", e);
        setLoadError(e instanceof Error ? e.message : "Failed to load audio");
        setIsReady(false);
        return false;
      } finally {
        if (generation === loadGenerationRef.current) {
          setIsLoading(false);
        }
      }
    },
    [onPlaybackStatusUpdate, setChunkDurationAt, unloadSound]
  );

  loadChunkAtRef.current = loadChunkAt;

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        if (mounted) console.warn("Audio mode:", e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Initial load when session starts (first URL only — never reload when more parts arrive).
  useEffect(() => {
    if (!urlsKey) {
      void unloadSound();
      setCurrentIndex(0);
      setChunkPositionMs(0);
      setChunkDurations([]);
      chunkDurationsRef.current = [];
      setIsPlaying(false);
      setIsReady(false);
      setWaitingForNext(false);
      waitingForNextRef.current = false;
      pendingPlayRef.current = false;
      return;
    }

    pendingPlayRef.current = false;
    void loadChunkAtRef.current(0, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reload on new session
  }, [urlsKey]);

  // Auto-continue when next part arrives while waiting at end of playlist.
  const urlCount = urls.length;
  useEffect(() => {
    if (!waitingForNextRef.current) return;
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < urlCount) {
      void loadChunkAtRef.current(nextIndex, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- react to new parts only
  }, [urlCount]);

  useEffect(() => {
    return () => {
      void unloadSound();
    };
  }, [unloadSound]);

  const togglePlayPause = async () => {
    if (isLoading) {
      pendingPlayRef.current = true;
      return;
    }

    let s = soundRef.current;
    if (!s) {
      const ok = await loadChunkAt(currentIndexRef.current, true);
      if (!ok) return;
      s = soundRef.current;
    }
    if (!s) return;

    const st = await s.getStatusAsync();
    if (!st.isLoaded) {
      const ok = await loadChunkAt(currentIndexRef.current, true);
      if (!ok) return;
      return;
    }

    try {
      if (st.isPlaying) {
        await s.pauseAsync();
      } else {
        await s.setVolumeAsync(PLAYBACK_VOLUME);
        await s.playAsync();
      }
    } catch (e) {
      console.error("Play/pause failed:", e);
      setLoadError(e instanceof Error ? e.message : "Playback failed");
    }
  };

  const applySeek = async (
    sound: Audio.Sound,
    ms: number,
    resume: boolean
  ): Promise<void> => {
    const st = await sound.getStatusAsync();
    if (!st.isLoaded) return;

    const maxMs = st.durationMillis ?? ms;
    const clamped = Math.max(0, Math.min(Math.round(ms), maxMs));

    const attemptSeek = async () => {
      const latest = await sound.getStatusAsync();
      if (!latest.isLoaded) return;
      if (latest.isPlaying) {
        await sound.pauseAsync();
      }
      await sound.setPositionAsync(clamped);
      if (resume) {
        await sound.playAsync();
      }
    };

    try {
      await attemptSeek();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.toLowerCase().includes("interrupted")) {
        throw e;
      }
      await new Promise((r) => setTimeout(r, 80));
      await attemptSeek().catch(() => {});
    }
  };

  const resolveSeekTarget = (targetMs: number) => {
    const durations = chunkDurationsRef.current;
    const available = urlsRef.current.length;
    let accumulated = 0;

    for (let i = 0; i < available; i++) {
      const dur = durations[i] ?? 0;
      const hasNext = i < available - 1;
      if (dur > 0 && hasNext && targetMs >= accumulated + dur) {
        accumulated += dur;
        continue;
      }
      return {
        index: i,
        localMs: Math.max(0, targetMs - accumulated),
      };
    }

    const last = Math.max(0, available - 1);
    const prior = durations.slice(0, last).reduce((a, b) => a + b, 0);
    return {
      index: last,
      localMs: Math.max(0, targetMs - prior),
    };
  };

  const seekToGlobal = async (targetMs: number) => {
    const { index, localMs } = resolveSeekTarget(targetMs);
    const shouldResume = wasPlayingBeforeSeekRef.current;
    const sameChunk =
      index === currentIndexRef.current &&
      loadedUrlRef.current === urlsRef.current[index] &&
      soundRef.current != null;

    if (sameChunk && soundRef.current) {
      await applySeek(soundRef.current, localMs, shouldResume);
      setCurrentIndex(index);
      currentIndexRef.current = index;
      setChunkPositionMs(localMs);
      const durations = chunkDurationsRef.current;
      const globalPos =
        durations.slice(0, index).reduce((a, b) => a + b, 0) + localMs;
      onProgressRef.current?.(globalPos, durations.reduce((a, b) => a + b, 0));
      return;
    }

    const ok = await loadChunkAt(index, false);
    if (!ok || !soundRef.current) return;

    await applySeek(soundRef.current, localMs, shouldResume);
    setChunkPositionMs(localMs);
    const durations = chunkDurationsRef.current;
    const globalPos =
      durations.slice(0, index).reduce((a, b) => a + b, 0) + localMs;
    onProgressRef.current?.(globalPos, durations.reduce((a, b) => a + b, 0));
  };

  const handleSlidingStart = () => {
    isSeekingRef.current = true;
    wasPlayingBeforeSeekRef.current = isPlayingRef.current;
    setSeekValue(globalPositionMs);
    onSeekStart?.();

    const s = soundRef.current;
    if (s && isPlayingRef.current) {
      void s.pauseAsync().catch(() => {});
    }
  };

  const handleValueChange = (value: number) => {
    if (isSeekingRef.current) {
      setSeekValue(value);
    }
  };

  const handleSlidingComplete = async (value: number) => {
    const gen = ++seekGenerationRef.current;
    const ms = Math.round(value);
    setSeekValue(ms);

    // Android tapToSeek can skip onSlidingStart — pause here if needed.
    if (!isSeekingRef.current) {
      isSeekingRef.current = true;
      wasPlayingBeforeSeekRef.current = isPlayingRef.current;
      onSeekStart?.();
      const s = soundRef.current;
      if (s && isPlayingRef.current) {
        await s.pauseAsync().catch(() => {});
      }
    }

    try {
      await seekToGlobal(ms);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.toLowerCase().includes("interrupted")) {
        console.error("Seek failed:", e);
      }
    } finally {
      if (gen === seekGenerationRef.current) {
        isSeekingRef.current = false;
        setSeekValue(null);
        onSeekEnd?.();
      }
    }
  };

  const handleSpeed = async (rate: number) => {
    setPlaybackRate(rate);
    playbackRateRef.current = rate;
    const s = soundRef.current;
    if (!s) return;
    try {
      await s.setRateAsync(rate, true);
    } catch (e) {
      console.error(e);
    }
  };

  if (urls.length === 0) return null;

  const formatMs = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
  };

  const totalLabel =
    expectMoreChunks && totalDurationMs > 0
      ? `${formatMs(totalDurationMs)}+`
      : formatMs(totalDurationMs);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <TouchableOpacity
          style={[styles.playButton, !isReady && !isLoading && styles.playButtonDim]}
          onPress={togglePlayPause}
          activeOpacity={0.8}
        >
          {isLoading && !isPlaying ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.playIcon}>
              {waitingForNext ? "⏳" : isPlaying ? "⏸" : "▶"}
            </Text>
          )}
        </TouchableOpacity>

        {loadError && <Text style={styles.errorText}>{loadError}</Text>}

        {urls.length > 1 && (
          <Text style={styles.chunkLabel}>
            Part {currentIndex + 1} of {expectMoreChunks ? `${urls.length}+` : urls.length}
          </Text>
        )}

        <View style={styles.sliderRow}>
          <Text style={styles.timeLabel}>{formatMs(sliderPosition)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={sliderMax}
            value={sliderPosition}
            step={0.1}
            disabled={!isReady && isLoading}
            onSlidingStart={handleSlidingStart}
            onValueChange={handleValueChange}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor={theme.colors.primary}
            maximumTrackTintColor={theme.colors.border}
            thumbTintColor={theme.colors.primary}
            {...(Platform.OS === "android" ? { tapToSeek: true } : {})}
          />
          <Text style={styles.timeLabel}>{totalLabel}</Text>
        </View>

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
    marginBottom: theme.spacing.sm,
  },
  playButtonDim: {
    opacity: 0.7,
  },
  playIcon: {
    fontSize: 28,
    color: "#fff",
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    textAlign: "center",
    marginBottom: theme.spacing.sm,
  },
  chunkLabel: {
    textAlign: "center",
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  slider: {
    flex: 1,
    height: 44,
  },
  timeLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    minWidth: 40,
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
