import { Stack } from "expo-router";
import { SelectedDateProvider } from "~/src/context/SelectedDateContext";

const MedicationLayout = () => {
  return (
    <SelectedDateProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SelectedDateProvider>
  );
};

export default MedicationLayout;
