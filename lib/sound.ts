import { Audio } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

export async function playSound(
  soundAsset: number,
  rate: number = 1.0,
  enabled: boolean = true
) {
  if (!enabled) return; // respect caller's setting
  try {
    // Cross-SDK safe constants (some SDKs expose enums, others flat constants)
    const IOS_MIX_WITH_OTHERS =
      (Audio as any).INTERRUPTION_MODE_IOS_MIX_WITH_OTHERS ??
      (Audio as any).InterruptionModeIOS?.MixWithOthers ??
      0; // Expo uses 0 for MixWithOthers
    const ANDROID_DUCK_OTHERS =
      (Audio as any).INTERRUPTION_MODE_ANDROID_DUCK_OTHERS ??
      (Audio as any).InterruptionModeAndroid?.DuckOthers ??
      2; // Expo uses 2 for DuckOthers

    // Ensure audio engine is enabled for this short SFX
    await Audio.setIsEnabledAsync(true);
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // allow UI sounds even with silent switch
      allowsRecordingIOS: false,
      interruptionModeIOS: IOS_MIX_WITH_OTHERS,
      shouldDuckAndroid: true, // briefly duck external audio instead of pausing it
      interruptionModeAndroid: ANDROID_DUCK_OTHERS,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    const { sound } = await Audio.Sound.createAsync(soundAsset, {
      shouldPlay: true,
    });
    await sound.setVolumeAsync(0.5);

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
