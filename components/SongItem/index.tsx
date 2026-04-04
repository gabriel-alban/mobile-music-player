import { Song } from "@/app/types";
import { Text, View } from "react-native";

export const SongItem = ({
  song,
  position,
}: {
  song: Song;
  position: number;
}) => {
  return (
    <View style={{ width: "100%", paddingBottom: 5 }}>
      <Text numberOfLines={1} ellipsizeMode="tail" style={{ flexShrink: 1 }}>
        {position}. {song.name}
      </Text>
    </View>
  );
};
