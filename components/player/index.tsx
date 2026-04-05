import { trackApi } from "@/app/api/trackApi";
import { Audio } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { Button, View } from "react-native";

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

  return (
    <View>
      <Button title="⏮ Prev" onPress={onPrevious} />
      <Button
        title={isPlaying ? "⏸ Pause" : "▶ Play"}
        onPress={togglePlayPause}
      />
      <Button title="Next ⏭" onPress={onNext} />
    </View>
  );
};
