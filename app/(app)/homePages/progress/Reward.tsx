// 🎁 Reward Screen
// This screen shows a reward card after completing all medications for the day.
// It assigns a new random card if one hasn't been granted for today.

import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFromStorage } from "~/src/services/storage";
import { format } from "date-fns";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase";

export default function Reward() {
  const router = useRouter();

  const [cardId, setCardId] = useState<number | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);

  // useEffect runs on component mount to handle reward logic
  useEffect(() => {
    // Firebase-based reward card assignment

    const assignRewardCard = async () => {
      try {
        // Get the currently logged-in user from local storage
        const user = await getFromStorage("userDetails");
        if (!user?.uid) return;

        const today = format(new Date(), "yyyy-MM-dd");
        // Reference to the user's reward card document in Firestore
        const ref = doc(db, "userCards", user.uid);
        const snap = await getDoc(ref);

        let userCards = snap.exists()
          ? snap.data()
          : { uid: user.uid, cards: {}, lastRewardedDate: "" };
        // Skip if a card has already been granted today
        if (userCards?.lastRewardedDate === today) {
          // Get last rewarded card ID
          const lastCardId = Object.keys(userCards.cards).pop();
          if (lastCardId) setCardId(Number(lastCardId));
          return;
        }

        // Pick a new card ID between 1–10
        const newCardId = Math.floor(Math.random() * 10) + 1;

        // Update card count or initialize if first time
        if (userCards.cards[newCardId]) {
          userCards.cards[newCardId] += 1;
        } else {
          userCards.cards[newCardId] = 1;
        }

        userCards.lastRewardedDate = today;

        // Save updated card info to Firestore
        if (snap.exists()) {
          await updateDoc(ref, userCards);
        } else {
          await setDoc(ref, userCards);
        }

        setCardId(newCardId);
      } catch (err) {
        console.error("Error assigning card:", err);
      } finally {
        setLoadingCard(false);
      }
    };

    assignRewardCard();
  }, []);

  // Navigate back to the Home tab
  const handleGoHome = () => {
    router.replace("/(app)/(tabs)/(home)");
  };

  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center p-6">
      <View className="items-center">
        <Text className="text-4xl font-bold text-primary mb-4">🎉</Text>
        <Text className="text-2xl font-semibold text-center text-gray-900 mb-2">
          You earned a reward!
        </Text>
        <Text className="text-base text-center text-gray-600 mb-8">
          Great job staying on track with your medication! Keep it up to earn
          even more rewards.
        </Text>
        {loadingCard ? (
          <Text className="text-gray-500">Loading your card...</Text>
        ) : cardId !== null ? (
          <Text className="text-lg font-semibold text-center mb-4">
            🎴 You unlocked card #{cardId}
          </Text>
        ) : (
          <Text className="text-red-500">Failed to load reward</Text>
        )}
        <Button onPress={handleGoHome}>
          <Text className="text-white font-medium">Back to Home</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
