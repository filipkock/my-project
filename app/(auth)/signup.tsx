import React, { useState } from "react";
import { SafeAreaView, Alert, View, Image, Platform } from "react-native";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { signInAnonymously } from "firebase/auth";
import { Link, router } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";

// Components
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import { setLocalStorage } from "~/src/services/storage";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

export default function signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(false);

  const redirectUri = makeRedirectUri({ scheme: "poka-reminder" });

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
  });

  React.useEffect(() => {
    (async () => {
      if (response?.type === "success") {
        const { id_token } = response.params;
        if (!id_token) return;
        const credential = GoogleAuthProvider.credential(id_token);
        const res = await signInWithCredential(auth, credential);
        setLocalStorage("userDetails", res.user);
        router.replace("/(auth)/allowNotification");
      }
    })();
  }, [response]);

  const handleGoogleSignup = () => {
    promptAsync();
  };

  const onHandleSignup = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!email || !password || !confirmPassword) {
      Alert.alert("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Passwords do not match");
      return;
    }
    if (trimmedEmail !== "" && trimmedPassword !== "") {
      createUserWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
        .then(async (UserCredential) => {
          const user = UserCredential.user;

          await updateProfile(user, {});

          setLocalStorage("userDetails", user);

          router.replace("/(auth)/allowNotification");
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
              Alert.alert(
                "Password is too weak",
                "Password should be at least 6 characters."
              );
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

      router.replace("/(auth)/allowNotification");
    } catch (error: any) {
      Alert.alert("Anonymous login failed", error.message);
    }
  };

  const player = useVideoPlayer(
    require("~/assets/animations/poka_waving.mp4"),
    (player) => {
      player.play();
      player.muted = true;
      player.loop = true;
    }
  );

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
        <View className="flex-1 mt-10 gap-6">
          <Text className="text-3xl font-bold">Sign up to get started!</Text>
          {showEmailForm && (
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
                secureTextEntry
              />
              <Input
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          )}
        </View>
        <View className="gap-4">
          {!showEmailForm && (
            <>
              <View className="items-center mb-5">
                <VideoView
                  style={{
                    width: 250,
                    height: 250,
                  }}
                  player={player}
                  allowsFullscreen={false}
                  allowsPictureInPicture={false}
                  nativeControls={false}
                />
              </View>

              {/* Google button */}
              <Button
                className="w-full"
                disabled={!request}
                onPress={handleGoogleSignup}
              >
                <Text>Continue with Google</Text>
              </Button>

              {/* 2) Divider with OR */}
              <View className="flex-row items-center my-2">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="px-3 text-gray-500">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>
            </>
          )}

          {/* 3) Outline button to reveal email/password form */}
          {!showEmailForm && (
            <Button
              className="w-full"
              variant="outline"
              onPress={() => setShowEmailForm(true)}
            >
              <Text>Email & password</Text>
            </Button>
          )}

          {/* 4) When selected, show confirm button and small link to switch method */}
          {showEmailForm && (
            <>
              <Button className="w-full" onPress={onHandleSignup}>
                <Text>Sign up</Text>
              </Button>
              <Text
                className="text-center underline mt-2"
                onPress={() => setShowEmailForm(false)}
              >
                Sign up with another method
              </Text>
            </>
          )}

          {!showEmailForm && (
            <Link href="../login" className="text-center underline mt-4">
              Already have an account? Log in
            </Link>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
