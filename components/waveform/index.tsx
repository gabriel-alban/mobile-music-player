import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

const BAR_COUNT = 20;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_HEIGHT = 40;
const MIN_HEIGHT = 4;

export const WaveForm = ({
  analyser,
  isPlaying,
}: {
  analyser: any;
  isPlaying: boolean;
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array(BAR_COUNT).fill(MIN_HEIGHT),
  );
  const rafRef = useRef(0);

  useEffect(() => {
    if (!analyser || !isPlaying) {
      setHeights(Array(BAR_COUNT).fill(MIN_HEIGHT));
      return;
    }

    const binCount = analyser.frequencyBinCount;
    const dataArray = new Float32Array(binCount);
    const binsPerBar = Math.max(1, Math.floor(binCount / BAR_COUNT));

    const update = () => {
      analyser.getByteFrequencyData(dataArray);

      const newHeights: number[] = [];
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < binsPerBar; j++) {
          const idx = i * binsPerBar + j;
          sum += idx < binCount ? dataArray[idx] : 0;
        }
        const avg = sum / binsPerBar; // 0-255
        const normalized = avg / 255;
        newHeights.push(MIN_HEIGHT + normalized * (MAX_HEIGHT - MIN_HEIGHT));
      }

      setHeights(newHeights);
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [analyser, isPlaying]);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: BAR_GAP,
        height: MAX_HEIGHT,
      }}
    >
      {heights.map((h, i) => (
        <View
          key={i}
          style={{
            width: BAR_WIDTH,
            height: h,
            borderRadius: BAR_WIDTH / 2,
            backgroundColor: "#4caf82",
          }}
        />
      ))}
    </View>
  );
};
