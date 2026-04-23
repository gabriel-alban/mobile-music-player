import { trackApi } from "@/app/api/trackApi";
import { Song } from "@/app/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useCallback, useEffect, useRef, useState } from "react";
import { GestureResponderEvent, Pressable, Text, View } from "react-native";
import { AudioContext } from "react-native-audio-api";
import { WaveForm } from "../waveform";

const TEXT_WHITE = "#FFFFFF";

const loadAudioBuffer = (url: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "arraybuffer";
    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(new Error(`HTTP ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send();
  });
};

export const Player = ({
  song,
  onPrevious,
  onNext,
}: {
  song: Song;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  const { data: streamUrl } = trackApi.useSong(song.id);
  const onNextRef = useRef(onNext);
  const progressBarWidth = useRef(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<any>(null);
  const sourceRef = useRef<any>(null);
  const audioBufferRef = useRef<any>(null);

  const startCtxTimeRef = useRef(0);
  const startOffsetRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [position, setPosition] = useState(0);
  const keepPlayingRef = useRef(false);

  const progress = song.duration > 0 ? position / (song.duration * 1000) : 0;

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  // Init AudioContext + AnalyserNode (once)
  useEffect(() => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.connect(ctx.destination);
    ctx.suspend();

    audioContextRef.current = ctx;
    analyserRef.current = analyser;

    return () => {
      ctx.close();
    };
  }, []);

  // Helper: create a new source node from buffer at offset
  const startSource = useCallback((buffer: any, offset: number) => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    try {
      sourceRef.current?.stop();
    } catch {}

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(analyserRef.current!);
    source.start(0, offset);
    sourceRef.current = source;

    startOffsetRef.current = offset;
    startCtxTimeRef.current = ctx.currentTime;
  }, []);

  // Load audio buffer when streamUrl changes
  useEffect(() => {
    if (!streamUrl || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    let cancelled = false;

    setIsLoading(true);
    setPosition(0);

    (async () => {
      try {
        // Resume context before decoding (some implementations require it)
        await ctx.resume();

        // Use XHR for reliable binary data in React Native
        const arrayBuffer = await loadAudioBuffer(streamUrl);
        console.log("Buffer size:", arrayBuffer.byteLength);

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

        if (cancelled) return;

        // Suspend again until user presses play
        await ctx.suspend();

        audioBufferRef.current = audioBuffer;
        startSource(audioBuffer, 0);

        if (keepPlayingRef.current) {
          await ctx.resume();
          setIsPlaying(true);
        }
      } catch (e) {
        console.error("Failed to load audio:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [streamUrl, startSource]);

  // Position tracking + song end detection
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const ctx = audioContextRef.current;
      if (!ctx) return;

      const elapsed =
        ctx.currentTime - startCtxTimeRef.current + startOffsetRef.current;
      const posMs = elapsed * 1000;

      if (elapsed >= song.duration) {
        setPosition(song.duration * 1000);
        setIsPlaying(false);
        if (keepPlayingRef.current) {
          onNextRef.current();
        }
        return;
      }

      setPosition(posMs);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, song.duration]);

  const togglePlayPause = useCallback(() => {
    const ctx = audioContextRef.current;
    if (!ctx || !sourceRef.current) return;

    if (isPlaying) {
      keepPlayingRef.current = false;
      ctx.suspend();
      setIsPlaying(false);
    } else {
      keepPlayingRef.current = true;
      ctx.resume();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleSeek = useCallback(
    (e: GestureResponderEvent) => {
      if (progressBarWidth.current === 0) return;
      const buffer = audioBufferRef.current;
      if (!buffer) return;

      const ratio = Math.max(
        0,
        Math.min(1, e.nativeEvent.locationX / progressBarWidth.current),
      );
      const seekTime = ratio * song.duration;

      startSource(buffer, seekTime);
      setPosition(seekTime * 1000);
    },
    [song.duration, startSource],
  );

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  const songTime = (value: number) => {
    const min = Math.floor(value / 60);
    const sec = value % 60;
    return `${min}:${sec}`;
  };

  return (
    <View>
      <View
        style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          padding: 10,
        }}
      >
        <Text style={{ color: TEXT_WHITE }}>Playing: </Text>
        <Text numberOfLines={1} style={{ flex: 1, color: TEXT_WHITE }}>
          {song.name}
        </Text>
      </View>

      <WaveForm analyser={analyserRef.current} isPlaying={isPlaying} />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          alignItems: "center",
          gap: 24,
          marginBottom: 10,
        }}
      >
        <Pressable onPress={onPrevious}>
          <MaterialIcons name="skip-previous" size={24} color={TEXT_WHITE} />
        </Pressable>
        <Pressable onPress={togglePlayPause} disabled={isLoading}>
          {!isPlaying ? (
            <AntDesign name="play-circle" size={24} color={TEXT_WHITE} />
          ) : (
            <AntDesign name="pause-circle" size={24} color={TEXT_WHITE} />
          )}
        </Pressable>
        <Pressable onPress={onNext}>
          <MaterialCommunityIcons
            name="skip-next"
            size={24}
            color={TEXT_WHITE}
          />
        </Pressable>
      </View>

      <Pressable
        onPress={handleSeek}
        onLayout={(e) => {
          progressBarWidth.current = e.nativeEvent.layout.width;
        }}
        style={{ height: 20, justifyContent: "center" }}
      >
        <View style={{ height: 4, backgroundColor: "#ddd", borderRadius: 2 }}>
          <View
            style={{
              position: "absolute",
              height: 4,
              width: `${progress * 100}%`,
              backgroundColor: "#096d2c",
              borderRadius: 2,
            }}
          />
        </View>
      </Pressable>

      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12, color: TEXT_WHITE }}>
          {formatTime(position)}
        </Text>
        <Text style={{ fontSize: 12, color: TEXT_WHITE }}>
          {songTime(song.duration)}
        </Text>
      </View>
    </View>
  );
};
