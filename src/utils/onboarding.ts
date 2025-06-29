import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "hasOnboarded";

export async function getOnboardingStatus(): Promise<boolean> {
  const value = await AsyncStorage.getItem(ONBOARDING_KEY);
  return value === "true";
}

export async function setOnboardingStatus(value: boolean): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, value ? "true" : "false");
}
