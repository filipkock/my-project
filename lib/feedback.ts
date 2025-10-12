import * as Haptics from "expo-haptics";
import { playSound } from "~/lib/sound";

const ButtonClick = require("~/assets/audio/button_click.wav");

export async function triggerFeedback({
  enableSound = true,
  enableHaptics = true,
} = {}) {
  try {
    if (enableHaptics) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (enableSound) {
      await playSound(ButtonClick, 1.0, true);
    }
  } catch (err) {
    console.warn("Feedback error:", err);
  }
}
