import React, { useEffect } from "react";
import { View } from "react-native";
import { VideoView } from "expo-video";
import { useSilentVideo } from "~/lib/useSilentVideo";

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  const player = useSilentVideo(
    require("~/assets/animations/splash.mp4"),
    false
  );

  return (
    <View className="absolute inset-0 z-50 items-center bg-[#F7F7F8] justify-center">
      <VideoView
        style={{
          width: 200,
          height: 200,
        }}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        nativeControls={false}
      />
    </View>
  );
}
