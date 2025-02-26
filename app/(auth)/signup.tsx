import React, { useState } from "react";
import { SafeAreaView, Alert } from "react-native";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../config/firebase";
import { Link, router } from "expo-router";

// Components
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { setLocalStorage } from "~/src/services/storage";

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

  return (
    <SafeAreaView className="flex-1 justify-center items-center gap-5 p-6 bg-secondary/30">
      <Card className="w-full max-w-sm p-6 rounded-2xl">
        <CardHeader>
          <CardTitle>signup</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
          <Input
            placeholder="Input your full name"
            value={name}
            onChangeText={setName}
            className="mb-4"
          />
          <Input
            placeholder="Input your email"
            value={email}
            onChangeText={setEmail}
            className="mb-4"
          />
          <Input
            placeholder="Input your password"
            value={password}
            onChangeText={setPassword}
            className="mb-4"
          />
          <Button
            className="w-full flex flex-row gap-2"
            onPress={onHandleSignup}
          >
            <Text>sing up!</Text>
          </Button>
          <Link href="../login" className="text-center underline">
            Login
          </Link>
        </CardContent>
      </Card>
    </SafeAreaView>
  );
}
