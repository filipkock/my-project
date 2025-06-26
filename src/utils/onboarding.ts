import * as SecureStore from "expo-secure-store";

const ONBOARDING_KEY = "hasOnboarded";

export async function getOnboardingStatus(): Promise<boolean> {
  const value = await SecureStore.getItemAsync(ONBOARDING_KEY);
  return value === "true";
}

export async function setOnboardingStatus(value: boolean): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, value ? "true" : "false");
}
