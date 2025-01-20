import { Stack } from "expo-router";

const AddNewMedicationLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="main"
        options={{
          headerShown: false,
        }}
      ></Stack.Screen>
    </Stack>
  );
};

export default AddNewMedicationLayout;
