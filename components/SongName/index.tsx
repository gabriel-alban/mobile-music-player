import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";

export const SongName = ({ title }: { title: string }) => {
  const marqueeAnim = useRef(new Animated.Value(0)).current;
  const containerWidth = useRef(0);
  const textWidth = useRef(0);
  const [measured, setMeasured] = useState(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!measured) return;

    const overflow = textWidth.current - containerWidth.current;

    if (overflow <= 0) {
      marqueeAnim.setValue(0);
      return;
    }

    marqueeAnim.setValue(0);

    const animate = () => {
      animationRef.current = Animated.sequence([
        Animated.delay(1500),
        Animated.timing(marqueeAnim, {
          toValue: -overflow,
          duration: (overflow / 40) * 1000,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(marqueeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
      animationRef.current.start(({ finished }) => {
        if (finished) animate();
      });
    };

    animate();

    return () => {
      animationRef.current?.stop();
    };
  }, [title, measured]);

  return (
    <View
      style={{ overflow: "hidden" }}
      onLayout={(e) => {
        containerWidth.current = e.nativeEvent.layout.width;
        if (textWidth.current > 0) setMeasured(true);
      }}
    >
      <Animated.Text
        numberOfLines={1}
        onLayout={(e) => {
          textWidth.current = e.nativeEvent.layout.width;
          if (containerWidth.current > 0) setMeasured(true);
        }}
        style={{ transform: [{ translateX: marqueeAnim }] }}
      >
        {title}
      </Animated.Text>
    </View>
  );
};
