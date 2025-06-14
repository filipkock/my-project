// 🎁 Reward Screen
// This screen shows a reward card after completing all medications for the day.
// It assigns a new random card if one hasn't been granted for today.

import React, { useEffect, useState } from "react";
import { View, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useRouter } from "expo-router";
import { getFromStorage } from "~/src/services/storage";
import { format } from "date-fns";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase";
import { cardImages } from "~/src/constants/cardMap";
import { useVideoPlayer, VideoView } from "expo-video";

type UserCards = {
  uid: string;
  cards: { [cardId: number]: number };
  lastRewardedDate: string;
};

export default function Reward() {
  const router = useRouter();

  // Video player logic for pack opening animation
  const [videoFinished, setVideoFinished] = useState(false);

  const player = useVideoPlayer(
    require("~/assets/animations/card_reveal.mp4"),
    (player) => {
      player.play();
      player.muted = true;
      // Remove setOnPlaybackStatusUpdate, handle status in VideoView below
    }
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoFinished(true);
    }, 2450); // 2 seconds for the video duration

    return () => clearTimeout(timer);
  }, []);

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

        let userCards: UserCards = snap.exists()
          ? (snap.data() as UserCards)
          : { uid: user.uid, cards: {}, lastRewardedDate: "" };
        // Skip if a card has already been granted today
        if (userCards?.lastRewardedDate === today) {
          // Get last rewarded card ID
          const lastCardId = Object.keys(userCards.cards).pop();
          if (lastCardId) setCardId(Number(lastCardId));
          return;
        }

        // Pick a new card ID between 1–X
        const newCardId = Math.floor(Math.random() * 2) + 1;

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

  const CardImageComponent =
    cardId !== null && cardImages.hasOwnProperty(cardId)
      ? cardImages[cardId]
      : null;

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center p-6">
        <View className="flex-1 justify-center items-center gap-4">
          <Text className="text-2xl font-semibold text-center text-gray-900 ">
            You earned a new card!
          </Text>
          {!videoFinished ? (
            <VideoView
              style={{ width: 400, height: 400 }}
              player={player}
              allowsFullscreen={false}
              allowsPictureInPicture={false}
              nativeControls={false}
            />
          ) : (
            <View
              style={{ width: 400, height: 400 }}
              className="justify-center items-center"
            >
              {loadingCard ? (
                <Text className="text-gray-500">Loading your card...</Text>
              ) : CardImageComponent ? (
                <CardImageComponent width={200} height={200} />
              ) : (
                <Text>No card component found</Text>
              )}
            </View>
          )}
        </View>

        <Button className="w-full" onPress={handleGoHome} size="lg">
          <Text className="text-white font-medium">CONTINUE</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
