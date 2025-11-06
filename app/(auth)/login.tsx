import React, { useState } from "react";
import { SafeAreaView, Alert, View, Platform } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebase";
import { signInAnonymously } from "firebase/auth";
import { router, Link } from "expo-router";
import { setLocalStorage } from "~/src/services/storage";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import { VideoView } from "expo-video";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Text } from "~/components/ui/text";
import Constants from "expo-constants";
import AppleSignInButton from "~/components/custom/AppleSignInButton";
import { useSilentVideo } from "~/lib/useSilentVideo";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleGoogleLogin = () => {
    promptAsync();
  };

  const handleAnonymousLogin = async () => {
    try {
      const result = await signInAnonymously(auth);
      setLocalStorage("userDetails", result.user);

      router.replace("/(auth)/allowNotification");
    } catch (error: any) {
      Alert.alert("Anonymous login failed", error.message);
    }
  };

  const onHandleLogin = () => {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (trimmedEmail !== "" && trimmedPassword !== "") {
      signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword)
        .then(async (UserCredential) => {
          const user = UserCredential.user;
          setLocalStorage("userDetails", user);

          router.replace("/(auth)/allowNotification");
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

  const player = useSilentVideo(
    require("~/assets/animations/poka_waving.mp4"),
    false
  );

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
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
            Continue as Guest
          </Text>
        </View>
        <View className="flex-1 mt-10 gap-6">
          <Text className="text-3xl font-bold">Login to continue</Text>
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
                secureTextEntry={true}
              />
            </View>
          )}
        </View>
        <View className="gap-4 ">
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
              {/* 1) Google first */}
              <Button
                className="w-full"
                disabled={!request}
                onPress={handleGoogleLogin}
              >
                <Text>Continue with Google</Text>
              </Button>

              <AppleSignInButton
                onSignedIn={(user) => {
                  setLocalStorage("userDetails", user);
                  router.replace("/(auth)/allowNotification");
                }}
                onError={(e) => {
                  Alert.alert("Apple Sign-In failed", e?.message || String(e));
                }}
              />

              {/* 2) Divider with OR */}
              <View className="flex-row items-center my-2">
                <View className="flex-1 h-px bg-gray-300" />
                <Text className="px-3 text-gray-500">or</Text>
                <View className="flex-1 h-px bg-gray-300" />
              </View>
              <Button
                className="w-full"
                variant="outline"
                onPress={() => setShowEmailForm(true)}
              >
                <Text>Email & password</Text>
              </Button>
            </>
          )}

          {/* 4) When selected, show confirm button and small link to switch method */}
          {showEmailForm && (
            <>
              <Button className="w-full" onPress={onHandleLogin}>
                <Text>Login</Text>
              </Button>
              <Text
                className="text-center underline text-sm mt-2"
                onPress={() => setShowEmailForm(false)}
              >
                Login with another method
              </Text>
            </>
          )}

          {/* Link to signup matches visibility with signup screen */}
          {!showEmailForm && (
            <Link href="../signup" className="text-center underline mt-4">
              Don’t have an account? Sign up
            </Link>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
