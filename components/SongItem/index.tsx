import { Song } from "@/app/types";
import { Text, View } from "react-native";

export const SongItem = ({
  song,
  position,
  onSetCurrentSongId,
}: {
  song: Song;
  position: number;
  onSetCurrentSongId: (id: number) => void;
}) => {
  return (
    <View style={{ width: "100%", paddingBottom: 5 }}>
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        style={{ flexShrink: 1 }}
        onPress={() => onSetCurrentSongId(song.id)}
      >
        {position}. {song.name}
      </Text>
    </View>
  );
};
