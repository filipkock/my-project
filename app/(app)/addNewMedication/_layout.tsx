import { Stack } from "expo-router";

const AddNewMedicationLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="step1"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="step2"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="step4"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="step4.1"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="step5"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="step6"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="step7"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="confirmStep"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
    </Stack>
  );
};

export default AddNewMedicationLayout;
