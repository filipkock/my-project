import { Audio } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

/**
 * Play a short UI sound effect without pausing background audio (e.g., Spotify).
 * Assumes global audio mode was primed in app/_layout.tsx via primeAudioMode().
 */
export async function playSound(
  soundAsset: number,
  rate: number = 1.0,
  enabled: boolean = true,
  volume: number = 0.5
) {
  if (!enabled) return;
  try {
    const { sound } = await Audio.Sound.createAsync(soundAsset, {
      shouldPlay: true,
    });
    await sound.setVolumeAsync(volume);
    await sound.setRateAsync(rate, true);
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) sound.unloadAsync();
    });
  } catch (err) {
    console.warn("Sound playback failed:", err);
  }
}
