// hooks/usePremiumGate.ts
import { Alert, Platform } from "react-native";
import { useSubscription } from "../providers/SubscriptionProvider";
import { useRouter } from "expo-router";
// If you use a toast lib, import it here instead of Alert

function showUpgradeToast(onUpgrade: () => void) {
  const msg = "Upgrade to Premium to use this feature.";
  Alert.alert("Premium feature", msg, [
    { text: "OK", style: "cancel" },
    { text: "Upgrade to Premium", onPress: onUpgrade },
  ]);
}

export function usePremiumGate() {
  const { status } = useSubscription();
  const isPremium = !!status?.active;
  const router = useRouter();

  /** Call this to guard an action. Returns true if allowed, false if blocked. */
  const guard = (action?: () => void) => {
    if (isPremium) {
      action?.();
      return true;
    }
    showUpgradeToast(() => router.push("/subscription/subscriptionPlans"));
    return false;
  };

  return { isPremium, guard };
}
