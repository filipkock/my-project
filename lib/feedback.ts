import * as Haptics from "expo-haptics";
import { playSound } from "~/lib/sound";
const ButtonClick = require("~/assets/audio/button_click.wav");

export async function triggerFeedback() {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await playSound(ButtonClick);
  } catch (err) {
    console.warn("Feedback error:", err);
  }
}
