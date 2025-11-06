import { useVideoPlayer } from "expo-video";
import { Platform } from "react-native";

export function useSilentVideo(source: number, loop: boolean = false) {
  return useVideoPlayer(source, (p) => {
    // Prevent background music pause
    p.audioMixingMode = Platform.select({
      ios: "mixWithOthers",
      android: "duckOthers",
      default: "auto",
    }) as any;

    // Silence always
    p.muted = true;
    p.volume = 0;

    // Loop or not
    p.loop = loop;

    p.play();
  });
}
