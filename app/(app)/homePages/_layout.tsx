import { Stack } from "expo-router";

const HomePagesLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="details"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="progress/DailyProgress"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="progress/Reward"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="progress/StreakResetNotice"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
};

export default HomePagesLayout;
