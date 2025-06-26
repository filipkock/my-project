import React, { useState } from "react";
import { SafeAreaView, Alert, View, Image } from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../config/firebase";
import { signInAnonymously } from "firebase/auth";
import { Link, router } from "expo-router";

// Components
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { setLocalStorage } from "~/src/services/storage";
import { getOnboardingStatus } from "~/src/utils/onboarding";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";

export default function signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onHandleSignup = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedname = name.trim();

    if (!email || !password) {
      Alert.alert("Please fill all fields");
      return;
    }
    if (trimmedEmail !== "" && trimmedPassword !== "" && trimmedname !== "") {
      createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
        .then(async (UserCredential) => {
          const user = UserCredential.user;

          await updateProfile(user, {
            displayName: trimmedname,
          });
          setLocalStorage("userDetails", user);

          router.replace("/(app)/(tabs)/(home)");
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;

          switch (errorCode) {
            case "auth/email-already-in-use":
              Alert.alert("Email already in use");
              break;
            case "auth/invalid-email":
              Alert.alert("Invalid email format");
              break;
            case "auth/operation-not-allowed":
              Alert.alert("Operation not allowed");
              break;
            case "auth/weak-password":
              Alert.alert("Password is too weak");
              break;
            default:
              Alert.alert("Signup error", errorMessage);
              break;
          }
        });
    } else {
      Alert.alert("Please fill all fields");
    }
  };

  const handleAnonymousSignup = async () => {
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

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-row justify-between items-center mb-8">
          <ChevronLeft
            size={32}
            color="black"
            onPress={() => router.push("../step1")}
          />
          <Text
            className="text-sm text-muted-foreground"
            onPress={handleAnonymousSignup}
          >
            Continue as Guest
          </Text>
        </View>
        <View className="flex-1 mt-10 gap-10">
          <Text className="text-3xl font-bold">Sign up to get started!</Text>
          <View className="gap-4">
            <Input
              placeholder="Input your full name"
              value={name}
              onChangeText={setName}
            />
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
          <Button className="w-full" onPress={onHandleSignup}>
            <Text>Sign up</Text>
          </Button>
          <Link href="../login" className="text-center underline">
            Login
          </Link>
        </View>
      </View>
    </SafeAreaView>
  );
}
