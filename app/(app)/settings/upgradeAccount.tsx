import { SafeAreaView, Alert, View } from "react-native";
import { useState } from "react";
import {
  updateProfile,
  EmailAuthProvider,
  linkWithCredential,
} from "firebase/auth";
import { auth } from "~/config/firebase";
import { router } from "expo-router";
import { setLocalStorage } from "~/src/services/storage";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";

export default function UpgradeAccount() {
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
      const user = auth.currentUser;
      if (user?.isAnonymous) {
        const credential = EmailAuthProvider.credential(
          trimmedEmail,
          trimmedPassword
        );
        linkWithCredential(user, credential)
          .then(async (UserCredential) => {
            const upgradedUser = UserCredential.user;
            await updateProfile(upgradedUser, {
              displayName: trimmedname,
            });
            setLocalStorage("userDetails", upgradedUser);
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
              case "auth/credential-already-in-use":
                Alert.alert("This account is already linked to another user.");
                break;
              default:
                Alert.alert("Signup error", errorMessage);
                break;
            }
          });
      } else {
        Alert.alert("Only anonymous users can upgrade here.");
      }
    } else {
      Alert.alert("Please fill all fields");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-row justify-between items-center mb-8">
          <Text
            className="text-sm text-muted-foreground"
            onPress={() => router.replace("/(app)/(tabs)/(home)")}
          >
            Back
          </Text>
        </View>
        <View className="flex-1 mt-10 gap-10">
          <Text className="text-3xl font-bold">Upgrade your account</Text>
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
            <Text>Create account</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
