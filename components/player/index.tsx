import { trackApi } from "@/app/api/trackApi";
import { Song } from "@/app/types";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef } from "react";
import { GestureResponderEvent, Pressable, Text, View } from "react-native";

const TEXT_WHITE = "#FFFFFF";

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
  const keepPlayingRef = useRef<boolean>(false);
  const onNextRef = useRef(onNext);
  const progressBarWidth = useRef(0);

  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  const player = useAudioPlayer(streamUrl ? { uri: streamUrl } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    if (streamUrl && keepPlayingRef.current) {
      player.play();
    }
  }, [streamUrl]);

  useEffect(() => {
    if (status.didJustFinish && keepPlayingRef.current) {
      onNextRef.current();
    }
  }, [status.didJustFinish]);

  const isPlaying = status.playing ?? false;
  const position = (status.currentTime ?? 0) * 1000;
  const progress = song.duration > 0 ? position / (song.duration * 1000) : 0;
  const bufferProgress = 0;

  const togglePlayPause = () => {
    if (isPlaying) {
      keepPlayingRef.current = false;
      player.pause();
    } else {
      keepPlayingRef.current = true;
      player.play();
    }
  };

  const handleSeek = (e: GestureResponderEvent) => {
    if (progressBarWidth.current === 0) return;
    const locationX = e.nativeEvent.locationX;
    const ratio = locationX / progressBarWidth.current;
    const clampedRatio = Math.max(0, Math.min(1, ratio));
    const newPositionSeconds = clampedRatio * song.duration;
    player.seekTo(newPositionSeconds);
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
        <Text style={{ color: TEXT_WHITE }}>Playing: </Text>
        <Text numberOfLines={1} style={{ flex: 1, color: TEXT_WHITE }}>
          {song.name}
        </Text>
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
              width: `${bufferProgress * 100}%`,
              backgroundColor: "#4caf82",
              borderRadius: 2,
            }}
          />
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

      {/* Timp */}
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
