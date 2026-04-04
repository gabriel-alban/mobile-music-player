import { SongItem } from "@/components/SongItem";
import { useState } from "react";
import { FlatList, Text, View } from "react-native";
import { trackApi } from "../api/trackApi";

export default function HomeScreen() {
  const { data, isLoading, error } = trackApi.useList();
  const [currentSongId, setCurrentSongId] = useState<number | undefined>();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!data) return;

  return (
    <View style={{ flex: 1, padding: 20, marginTop: 20 }}>
      <FlatList
        data={data.data}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View
            style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
          >
            <Text style={{ fontSize: 24, fontWeight: "bold" }}>Player</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <SongItem song={item} position={index + 1} />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
