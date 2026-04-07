import { trackApi } from "@/app/api/trackApi";
import { Song } from "@/app/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Audio, AVPlaybackStatus } from "expo-av";
import { useEffect, useRef, useState } from "react";
import { GestureResponderEvent, Pressable, Text, View } from "react-native";

export const Player = ({
  song,
  onPrevious,
  onNext,
}: {
  song: Song;
  onPrevious: () => void;
  onNext: () => void;
}) => {
  const { data: streamUrl, isLoading } = trackApi.useSong(song.id);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [position, setPosition] = useState(0);

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

  const progress = song.duration > 0 ? position / (song.duration * 1000) : 0;
  const progressBarWidth = useRef(0);

  const handleSeek = async (e: GestureResponderEvent) => {
    if (!soundRef.current || progressBarWidth.current === 0) return;
    const ratio = e.nativeEvent.locationX / progressBarWidth.current;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const newPositionMs = clampedRatio * song.duration * 1000;
    await soundRef.current.setPositionAsync(newPositionMs);
    setPosition(newPositionMs);
  };

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
        <Text>Playing: </Text>
        <Text>{song.name}</Text>
      </View>
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
          <MaterialIcons name="skip-previous" size={24} color="black" />
        </Pressable>
        <Pressable onPress={togglePlayPause}>
          <AntDesign name="play-circle" size={24} color="black" />
        </Pressable>
        <Pressable onPress={onNext}>
          <MaterialCommunityIcons name="skip-next" size={24} color="black" />
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
              height: 4,
              width: `${progress * 100}%`,
              backgroundColor: "#096d2c",
              borderRadius: 2,
            }}
          />
        </View>
      </Pressable>

      {/* Timp */}
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 12 }}>{formatTime(position)}</Text>
        <Text style={{ fontSize: 12 }}>{songTime(song.duration)}</Text>
      </View>
    </View>
  );
};
