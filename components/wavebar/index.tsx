import { useEffect } from "react";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const MIN_HEIGHT = 4;
const MAX_HEIGHT = 40;
const BAR_WIDTH = 3;

export const WaveBar = ({
  isPlaying,
  index,
}: {
  isPlaying: boolean;
  index: number;
}) => {
  const height = useSharedValue(MIN_HEIGHT);

  useEffect(() => {
    if (isPlaying) {
      const duration = 300 + (index % 5) * 80;
      const peak = MIN_HEIGHT + Math.random() * (MAX_HEIGHT - MIN_HEIGHT);

      height.value = withDelay(
        index * 40,
        withRepeat(
          withSequence(
            withTiming(peak, { duration, easing: Easing.inOut(Easing.ease) }),
            withTiming(MIN_HEIGHT + Math.random() * 10, {
              duration: duration * 0.8,
              easing: Easing.inOut(Easing.ease),
            }),
          ),
          -1,
          true,
        ),
      );
    } else {
      cancelAnimation(height);
      height.value = withTiming(MIN_HEIGHT, { duration: 300 });
    }
  }, [isPlaying]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: BAR_WIDTH,
          borderRadius: BAR_WIDTH / 2,
          backgroundColor: "#4caf82",
        },
        animatedStyle,
      ]}
    />
  );
};
