import { Stack } from "expo-router";

const LoginLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="signup"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="step1"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="allowNotification"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
      <Stack.Screen
        name="createMedication"
        options={{
          headerShown: false,
          animation: "none",
        }}
      ></Stack.Screen>
    </Stack>
  );
};

export default LoginLayout;
