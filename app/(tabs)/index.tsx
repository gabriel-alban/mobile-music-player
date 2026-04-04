import ParallaxScrollView from "@/components/parallax-scroll-view";
import { Text } from "react-native";
import { trackApi } from "../api/trackApi";

export default function HomeScreen() {
  const { data, isLoading, error } = trackApi.useList();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  console.log(data);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={<></>}
    >
      <Text>PLayer</Text>
    </ParallaxScrollView>
  );
}
