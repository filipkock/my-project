import React, { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  getAuth,
  signInWithCredential,
  OAuthProvider,
  User,
} from "firebase/auth";
import { triggerFeedback } from "~/lib/feedback";
import { useSettings } from "~/src/context/settingsContext";

function randomString(length = 32) {
  const chars =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let out = "";
  for (let i = 0; i < length; i++)
    out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function sha256(input: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

export default function AppleSignInButton({
  onSignedIn,
  onError,
  buttonType = AppleAuthentication.AppleAuthenticationButtonType.CONTINUE,
  buttonStyle,
  width = 260,
  height,
  cornerRadius,
  fullWidth = false,
}: {
  onSignedIn?: (user: User) => void;
  onError?: (e: any) => void;
  buttonType?: AppleAuthentication.AppleAuthenticationButtonType;
  buttonStyle?: AppleAuthentication.AppleAuthenticationButtonStyle;
  width?: number | string;
  height?: number;
  cornerRadius?: number;
  fullWidth?: boolean;
}) {
  const { soundEnabled } = useSettings();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    if (Platform.OS !== "ios") {
      setIsAvailable(false);
      return;
    }
    AppleAuthentication.isAvailableAsync()
      .then(setIsAvailable)
      .catch(() => setIsAvailable(false));
  }, []);

  if (isAvailable !== true) return null;

  const onPress = async () => {
    try {
      await triggerFeedback({ enableSound: soundEnabled });
    } catch {}

    try {
      const rawNonce = randomString();
      const hashedNonce = await sha256(rawNonce);

      const appleCred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce, // protects against replay attacks
      });

      if (!appleCred.identityToken)
        throw new Error("No identity token from Apple");

      // Pass Apple token to Firebase
      const provider = new OAuthProvider("apple.com");
      const authCredential = provider.credential({
        idToken: appleCred.identityToken,
        rawNonce, // Firebase must receive the *raw* nonce
      });

      const auth = getAuth();
      await signInWithCredential(auth, authCredential);

      const user = getAuth().currentUser;
      if (user && onSignedIn) onSignedIn(user);

      // Important: appleCred.fullName/email are only provided on the FIRST signup.
      // If you need them, save once (and ignore undefined on subsequent logins).
      // You’re signed in at this point.
    } catch (e: any) {
      if (e?.code === "ERR_CANCELED") return; // user canceled
      if (onError) onError(e);
      console.warn("Apple sign-in error:", e);
    }
  };

  return (
    <View style={{ width: "100%", alignItems: "center", marginVertical: 8 }}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={100}
        style={{ width: "100%", height: 42 }}
        onPress={onPress}
      />
    </View>
  );
}
