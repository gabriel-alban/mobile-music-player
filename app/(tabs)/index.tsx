import { Player } from "@/components/player";
import { SongItem } from "@/components/SongItem";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Text, View } from "react-native";
import { trackApi } from "../api/trackApi";
import { Song } from "../types";

export default function HomeScreen() {
  const { data, isLoading } = trackApi.useList();
  const [currentSongId, setCurrentSongId] = useState<number | undefined>();

  useEffect(() => {
    if (!data) return;
    if (data?.data.length > 0) {
      setCurrentSongId(1);
    }
  }, [data, setCurrentSongId]);

  const currentIndex = useMemo(
    () => data?.data.findIndex((el: Song) => el.id === currentSongId) ?? -1,
    [currentSongId, data],
  );

  const currentSong = useMemo(
    () => data?.data.find((el: Song) => el.id === currentSongId) ?? {},
    [currentIndex, data],
  );

  const handleNext = useCallback(() => {
    if (!data || currentIndex < 0) return;

    if (currentIndex < data.data.length - 1)
      setCurrentSongId(data.data[currentIndex + 1].id);
  }, [currentIndex, setCurrentSongId, data]);

  const handlePrev = useCallback(() => {
    if (!data || currentIndex < 0) return;
    if (currentIndex > 0) setCurrentSongId(data.data[currentIndex - 1].id);
  }, [currentIndex, setCurrentSongId, data]);

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!data) return null;

  return (
    <View style={{ flex: 1, padding: 20, marginTop: 20 }}>
      <Player song={currentSong} onNext={handleNext} onPrevious={handlePrev} />
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
          <SongItem
            song={item}
            position={index + 1}
            onSetCurrentSongId={setCurrentSongId}
          />
        )}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
