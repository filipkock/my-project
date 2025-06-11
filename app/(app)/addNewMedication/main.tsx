import { Stack, router } from "expo-router";
import { useEffect } from "react";

export default function AddNewMedicationMain() {
  useEffect(() => {
    router.replace("/addNewMedication/step1");
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
