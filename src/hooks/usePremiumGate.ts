// hooks/usePremiumGate.ts
import { Alert, Platform } from "react-native";
import { useSubscription } from "../providers/SubscriptionProvider";
// If you use a toast lib, import it here instead of Alert

function showUpgradeToast() {
  // Replace with your toast lib if you have one (e.g. react-native-toast-message)
  const msg = "Upgrade to Premium to use this feature.";
  if (Platform.OS === "android") {
    // simple optional: ToastAndroid.show(msg, ToastAndroid.SHORT);
    Alert.alert("Premium feature", msg);
  } else {
    Alert.alert("Premium feature", msg);
  }
}

export function usePremiumGate() {
  const { status } = useSubscription();
  const isPremium = !!status?.active;

  /** Call this to guard an action. Returns true if allowed, false if blocked. */
  const guard = (action?: () => void) => {
    if (isPremium) {
      action?.();
      return true;
    }
    showUpgradeToast();
    return false;
  };

  return { isPremium, guard };
}
