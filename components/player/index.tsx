import { trackApi } from "@/app/api/trackApi";
import { Audio, AVPlaybackStatus } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Button, Text, View } from "react-native";

export const Player = ({
  currentSongId,
  onPrevious,
  onNext,
}: {
  currentSongId: number | undefined;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  const { data: streamUrl, isLoading } = trackApi.useSong(currentSongId);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState(0); // milliseconds
  const [duration, setDuration] = useState(0); // milliseconds

  useEffect(() => {
    let cancelled = false;

    const loadAndPlay = async () => {
      try {
        if (!streamUrl) return;

        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }

        const { sound } = await Audio.Sound.createAsync(
          { uri: streamUrl },
          { shouldPlay: true },
        );
        console.log(sound);

        if (cancelled) {
          await sound.unloadAsync();
          return;
        }

        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          setIsPlaying(status.isPlaying);
          setPosition(status.positionMillis);
          setDuration(status.durationMillis ?? 0);
        });

        soundRef.current = sound;
      } catch (err) {
        console.error("Failed to load/play audio", err);
      }
    };

    loadAndPlay();

    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
    };
  }, [streamUrl]);

  const togglePlayPause = async () => {
    if (!soundRef.current) return;

    if (isPlaying) {
      await soundRef.current.pauseAsync();
    } else {
      await soundRef.current.playAsync();
    }
  };

  const progress = duration > 0 ? position / duration : 0;

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <View>
      <View style={{ height: 4, backgroundColor: "#ddd", borderRadius: 2 }}>
        <View
          style={{
            height: 4,
            width: `${progress * 100}%`,
            backgroundColor: "#096d2c",
            borderRadius: 2,
          }}
        />
      </View>

      {/* Timp */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12 }}>{formatTime(position)}</Text>
        <Text style={{ fontSize: 12 }}>{formatTime(duration)}</Text>
      </View>

      <View>
        <Button title="⏮ Prev" onPress={onPrevious} />
        <Button
          title={isPlaying ? "⏸ Pause" : "▶ Play"}
          onPress={togglePlayPause}
        />
        <Button title="Next ⏭" onPress={onNext} />
      </View>
    </View>
  );
};
