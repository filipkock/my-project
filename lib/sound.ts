import { Audio } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

export async function playSound(
  soundAsset: number,
  rate: number = 1.0,
  enabled: boolean = true
) {
  if (!enabled) return; // respect caller's setting
  try {
    const { sound } = await Audio.Sound.createAsync(soundAsset, {
      shouldPlay: true,
    });

    // set playback rate (1.0 = normal speed)
    await sound.setRateAsync(rate, true);

    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (err) {
    console.warn("Sound playback failed:", err);
  }
}
