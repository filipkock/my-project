import { Audio } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";
import { useSettings } from "~/src/context/settingsContext";

export async function playSound(soundAsset: number, rate: number = 1.0) {
  const { soundEnabled } = useSettings(); // Access global setting
  if (!soundEnabled) return; // Skip entirely if off
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
