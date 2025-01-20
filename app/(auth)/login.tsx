import React, { useState } from "react";
import { SafeAreaView, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { router, Link } from "expo-router";
import { setLocalStorage } from "~/services/storage";

// Components
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    <SafeAreaView className="flex-1 justify-center items-center gap-5 p-6 bg-secondary/30">
      <Card className="w-full max-w-sm p-6 rounded-2xl">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent className="gap-4">
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
            onPress={onHandleLogin}
          >
            <Text>Login in!</Text>
          </Button>
          <Link href="../signup" className="text-center underline">
            Sign up
          </Link>
        </CardContent>
      </Card>
    </SafeAreaView>
  );
}
