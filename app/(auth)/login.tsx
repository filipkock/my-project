import React, { useState } from "react";
import { SafeAreaView, Alert, View } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { signInAnonymously } from "firebase/auth";
import { router, Link } from "expo-router";
import { setLocalStorage } from "~/src/services/storage";
import { getOnboardingStatus } from "~/src/utils/onboarding";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";

// Components
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAnonymousLogin = async () => {
    try {
      const result = await signInAnonymously(auth);
      setLocalStorage("userDetails", result.user);
      const onboarded = await getOnboardingStatus();
      if (onboarded) {
        router.replace("/(app)/(tabs)/(home)");
      } else {
        router.replace("/(auth)/allowNotification");
      }
    } catch (error: any) {
      Alert.alert("Anonymous login failed", error.message);
    }
  };

  const onHandleLogin = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (trimmedEmail !== "" && trimmedPassword !== "") {
      signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
        .then((UserCredential) => {
          const user = UserCredential.user;
          setLocalStorage("userDetails", user);
          router.replace("/(app)/(tabs)/(home)");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;

          switch (errorCode) {
            case "auth/invalid-email":
              Alert.alert("Invalid email format");
              break;
            case "auth/user-disabled":
              Alert.alert("User account is disabled");
              break;
            case "auth/user-not-found":
              Alert.alert("No user found with this email");
              break;
            case "auth/wrong-password":
              Alert.alert("Incorrect password");
              break;
            default:
              Alert.alert("Login error", errorMessage);
              break;
          }
        });
    } else {
      Alert.alert("Login error", "Email and password cannot be empty");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 px-8 pt-8 pb-4">
        <View className="flex-row items-center justify-between mb-8">
          <ChevronLeft
            size={32}
            color="black"
            onPress={() => router.push("../step1")}
          />
          <Text
            className="text-sm text-muted-foreground "
            onPress={handleAnonymousLogin}
          >
            Skip
          </Text>
        </View>
        <View className="flex-1 mt-10 gap-10">
          <Text className="text-3xl font-bold">Login to continue</Text>
          <View className="gap-4">
            <Input
              placeholder="Input your email"
              value={email}
              onChangeText={setEmail}
            />
            <Input
              placeholder="Input your password"
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>
        <View className="gap-4">
          <Button className="w-full" onPress={onHandleLogin}>
            <Text>Login</Text>
          </Button>
          <Link href="../signup" className="text-center underline">
            Sign up
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
