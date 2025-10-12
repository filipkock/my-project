import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import type { AVPlaybackStatus } from "expo-av";

// Import your button click sound
const ButtonClick = require("~/assets/audio/button_click.wav");

/**
 * Plays a short haptic feedback + click sound combo.
 * Safe to call from anywhere in the app (await optional).
 */
export async function triggerFeedback() {
  try {
    // Haptic feedback (only on mobile)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Play short click sound
    const { sound } = await Audio.Sound.createAsync(ButtonClick, {
      shouldPlay: true,
    });

    // Automatically unload sound when finished
    sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (err) {
    console.warn("Feedback error:", err);
  }
}
