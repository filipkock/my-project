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
    </Stack>
  );
};

export default LoginLayout;
