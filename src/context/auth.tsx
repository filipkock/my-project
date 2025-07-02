// app/context/auth.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import {
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut,
} from "firebase/auth";
import { auth } from "../../config/firebase";

type AuthContextType = {
  user: User | null;
  signOut: () => Promise<void>;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (value: boolean) => void;
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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Load onboarding state from AsyncStorage on mount
  useEffect(() => {
    const loadOnboardingState = async () => {
      const value = await AsyncStorage.getItem("hasCompletedOnboarding");
      setHasCompletedOnboarding(value === "true");
    };
    loadOnboardingState();
  }, []);

  // Redirect logic based on user and onboarding state
  useEffect(() => {
    if (initializing) return;

    const rootSegment = segments[0];

    if (!user && rootSegment !== "(auth)") {
      router.replace("/(auth)/step1");
    }

    if (user && hasCompletedOnboarding && rootSegment !== "(app)") {
      router.replace("/(app)/(tabs)/(home)");
    }
  }, [user, segments, initializing, hasCompletedOnboarding]);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  async function signOut() {
    console.trace("SIGN-OUT triggered");
    await firebaseSignOut(auth);
  }

  const value: AuthContextType = {
    user,
    signOut,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Show children only when we're done checking auth state */}
      {initializing ? null : children}
    </AuthContext.Provider>
  );
}
