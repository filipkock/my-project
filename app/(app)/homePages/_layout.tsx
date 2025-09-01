import { Stack } from "expo-router";

const HomePagesLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="details"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="progress/DailyProgress"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="progress/Reward"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Stack.Screen
        name="progress/StreakResetNotice"
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
    </Stack>
  );
};

export default HomePagesLayout;
