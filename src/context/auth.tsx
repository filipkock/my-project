// app/context/auth.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../../config/firebase";

import {
  getOnboardingStatus,
  setOnboardingStatus,
} from "~/src/utils/onboarding";

type AuthContextType = {
  user: User | null;
  signOut: () => Promise<void>;
  onboarded: boolean;
};

const AuthContext = createContext<AuthContextType | null>(null);

// Use the context to access the auth state in any component
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// AuthProvider to wrap the app with to provide auth state
export function AuthProvider({ children }: React.PropsWithChildren) {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean>(false);

  // Load onboarding state and handle redirect based on user status
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (initializing || !router) return;

      const onboardingStatus = await getOnboardingStatus();
      setOnboarded(onboardingStatus);
      console.log("onboardingStatus,", onboardingStatus);
      const rootSegment = segments[0];
      if (!user) {
        console.log("user not exists");
        if (!onboardingStatus && rootSegment !== "(auth)") {
          console.log("step1?");
          router.replace("/(auth)/step1");
        } else if (onboardingStatus && rootSegment !== "(auth)") {
          console.log("login");
          router.replace("/(auth)/login");
        }
      } else {
        console.log("user exists");

        if (rootSegment !== "(app)" && onboardingStatus) {
          console.log("home");
          router.replace("/(app)/(tabs)/(home)");
        }
      }
    };
    checkAndRedirect();
  }, [user, segments, initializing]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  async function signOut() {
    await firebaseSignOut(auth);
    // Optionally reset onboarding status, used for testing
    await setOnboardingStatus(false);
    setOnboarded(false);
  }

  const value: AuthContextType = {
    user,
    signOut,
    onboarded,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show children only when we're done checking auth state */}
      {initializing ? null : children}
    </AuthContext.Provider>
  );
}
