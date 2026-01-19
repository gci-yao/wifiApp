import { Dimensions, View } from "react-native";
import * as Animatable from "react-native-animatable";

const { width, height } = Dimensions.get("window");

export default function AnimatedBackground() {
  return (
    <View style={{ position: "absolute", width, height }}>
      {[...Array(10)].map((_, i) => (
        <Animatable.View
          key={i}
          animation="fadeIn"
          iterationCount="infinite"
          direction="alternate"
          duration={4000 + i * 200}
          style={{
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: `rgba(37, 211, 102, ${0.2 + i * 0.05})`,
            position: "absolute",
            top: Math.random() * height,
            left: Math.random() * width,
          }}
        />
      ))}
    </View>
  );
}
