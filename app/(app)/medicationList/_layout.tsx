import { Stack } from "expo-router";

const EditMedicationLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="editMedication"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="medicationDetails"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
    </Stack>
  );
};

export default EditMedicationLayout;
