import { Stack } from "expo-router";
import { SelectedDateProvider } from "~/src/context/SelectedDateContext";

const HomeLayout = () => {
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

export default HomeLayout;
