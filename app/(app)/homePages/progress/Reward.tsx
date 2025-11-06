// 🎁 Reward Screen
// This screen shows a reward card after completing all medications for the day.
// It assigns a new random card if one hasn't been granted for today.

import React, { useEffect, useState } from "react";
import { StarIcon } from "react-native-heroicons/solid";
import { ArrowRightIcon } from "react-native-heroicons/solid";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { View, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { useRouter } from "expo-router";
import { getFromStorage } from "~/src/services/storage";
import { format } from "date-fns";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase";
import {
  cardImages,
  cardQuotes,
  cardNames,
  cardCollections,
  cardIsPremium,
} from "~/src/constants/cardMap";
import { VideoView } from "expo-video";
import { Badge } from "~/components/ui/badge";
import { Stepper } from "~/components/custom/Stepper";
import { usePremiumGate } from "~/src/hooks/usePremiumGate";
import * as Haptics from "expo-haptics";
import { useSettings } from "~/src/context/settingsContext";
import { playSound } from "~/lib/sound";
import { useSilentVideo } from "~/lib/useSilentVideo";

const animationSound = require("~/assets/audio/card_reveal.wav");

type UserCards = {
  uid: string;
  cards: { [cardId: number]: number };
  lastRewardedDate: string;
};

export default function Reward() {
  const router = useRouter();
  const { isPremium } = usePremiumGate();
  const { soundEnabled } = useSettings();

  // Video player logic for pack opening animation
  const [videoFinished, setVideoFinished] = useState(false);

  useEffect(() => {
    // Subtle build-up taps and a final thump (aligned with ~2.45s video)
    const timeouts: number[] = [];
    if (Platform.OS !== "web") {
      const plan: Array<[number, Haptics.ImpactFeedbackStyle]> = [
        [600, Haptics.ImpactFeedbackStyle.Light],
        [900, Haptics.ImpactFeedbackStyle.Light],
        [1200, Haptics.ImpactFeedbackStyle.Medium],
        [1500, Haptics.ImpactFeedbackStyle.Light],
        [1800, Haptics.ImpactFeedbackStyle.Medium],
        [2200, Haptics.ImpactFeedbackStyle.Heavy], // reveal thump
      ];

      plan.forEach(([ms, style]) => {
        const id = setTimeout(() => {
          Haptics.impactAsync(style).catch(() => {});
        }, ms) as unknown as number;
        timeouts.push(id);
      });
    }
    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (videoFinished && Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {}
      );
    }
  }, [videoFinished]);

  const player = useSilentVideo(
    require("~/assets/animations/card_reveal.mp4"),
    false
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setVideoFinished(true);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  //
  useEffect(() => {
    const playButtonSound = async () => {
      await playSound(animationSound, 1, soundEnabled);
    };

    const timer = setTimeout(() => {
      playButtonSound();
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const [cardId, setCardId] = useState<number | null>(null);
  const [loadingCard, setLoadingCard] = useState(true);
  const [isNewCard, setIsNewCard] = useState(false);
  const [isEvolved, setIsEvolved] = useState(false);
  const [cardCount, setCardCount] = useState<number>(0);
  const [stepperCardCount, setstepperCardCount] = useState<number>(0);

  // Custom shimmer animation for evolved cards
  const shimmerTranslateX = useSharedValue(-300);

  useEffect(() => {
    if (isEvolved && videoFinished) {
      shimmerTranslateX.value = withRepeat(
        withTiming(600, { duration: 3000 }),
        -1,
        false
      );
    }
  }, [isEvolved, videoFinished]);

  useEffect(() => {
    if (isEvolved && videoFinished && Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  }, [isEvolved, videoFinished]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  const animateStepperCount = (finalCount: number) => {
    setstepperCardCount(0);
    setTimeout(() => {
      for (let i = 1; i <= finalCount; i++) {
        setTimeout(() => {
          setstepperCardCount(i);
        }, i * 100);
      }
    }, 2500);
  };

  // Reward logic
  useEffect(() => {
    const assignRewardCard = async () => {
      try {
        const user = await getFromStorage("userDetails");
        if (!user?.uid) return;

        const today = format(new Date(), "yyyy-MM-dd");
        const ref = doc(db, "userCards", user.uid);
        const snap = await getDoc(ref);

        let userCards: UserCards = snap.exists()
          ? (snap.data() as UserCards)
          : { uid: user.uid, cards: {}, lastRewardedDate: "" };

        if (userCards.lastRewardedDate === today) {
          const lastCardId = Object.keys(userCards.cards).pop();
          if (lastCardId) {
            const numericId = Number(lastCardId);
            setCardId(numericId);
            const count = userCards.cards[numericId];
            setCardCount(count);

            // For stepper to ensure it updates as an animation
            animateStepperCount(count);
            if (count >= 10) setIsEvolved(true);
          }
          return;
        }

        // Build the list of card IDs the user is eligible to receive
        const allIds = Object.keys(cardCollections).map((k) => Number(k));
        const eligibleIds = isPremium
          ? allIds
          : allIds.filter((id) => !cardIsPremium[id]);

        // Fallback guard: if for some reason list is empty, fall back to all
        const pool = eligibleIds.length > 0 ? eligibleIds : allIds;
        const newCardId = pool[Math.floor(Math.random() * pool.length)];

        const isNew = !userCards.cards[newCardId];
        setIsNewCard(isNew);

        userCards.cards[newCardId] = (userCards.cards[newCardId] || 0) + 1;
        userCards.lastRewardedDate = today;

        if (snap.exists()) {
          await updateDoc(ref, userCards);
        } else {
          await setDoc(ref, userCards);
        }

        const count = userCards.cards[newCardId];
        setCardId(newCardId);
        setCardCount(count);

        // For stepper to ensure it updates as an animation
        animateStepperCount(count);
        if (count >= 10) setIsEvolved(true);
      } catch (err) {
        console.error("Error assigning card:", err);
      } finally {
        setLoadingCard(false);
      }
    };

    assignRewardCard();
  }, []);

  const handleGoHome = () => {
    router.replace("/(app)/(tabs)/(home)");
  };

  const CardImageComponent =
    cardId !== null && cardImages.hasOwnProperty(cardId)
      ? cardImages[cardId]
      : null;

  const cardQuote = cardId !== null ? cardQuotes[cardId] : "";

  return (
    <SafeAreaView className="flex-1">
      {/* Global shimmer overlay when evolved */}
      {isEvolved && (
        <View className="absolute inset-0 z-0">
          <Animated.View style={shimmerStyle}>
            <LinearGradient
              colors={["transparent", "rgba(255,255,255,0.1)", "transparent"]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ height: "100%", width: "100%" }}
            />
          </Animated.View>
        </View>
      )}

      <View className="flex-1 items-center p-8">
        <View className="flex-1 justify-center items-center gap-1">
          {videoFinished && cardId !== null && (
            <View className="items-start gap-2">
              <View className="flex-col items-center gap-1">
                {isNewCard && (
                  <Badge className="mb-3">
                    <Text className="text-xs">NEW CARD</Text>
                  </Badge>
                )}
                <Text className="text-3xl font-semibold text-gray-900">
                  {cardNames[cardId]} {isEvolved ? "Lv. 2" : "Lv. 1"}
                </Text>
                <Text className="text-sm text-gray-500">
                  {cardCollections[cardId]} collection
                </Text>
              </View>
            </View>
          )}

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
                <View className="items-center">
                  <View
                    className={
                      "justify-center items-center rounded-xl p-6 relative"
                    }
                    style={{ transform: isEvolved ? [{ scale: 1.1 }] : [] }}
                  >
                    <View className="relative z-10">
                      <CardImageComponent width={200} height={200} />
                    </View>

                    {isEvolved && (
                      <View className="absolute inset-0 rounded-xl overflow-hidden z-20">
                        <Animated.View
                          style={[
                            {
                              position: "absolute",
                              top: 0,
                              bottom: 0,
                              left: 12,
                              right: 12,
                              borderRadius: 12,
                              overflow: "hidden",
                            },
                            shimmerStyle,
                          ]}
                        >
                          <LinearGradient
                            colors={[
                              "transparent",
                              "rgba(255,255,255,0.2)",
                              "rgba(255,255,255,0.5)",
                              "rgba(255,255,255,0.2)",
                              "transparent",
                            ]}
                            locations={[0, 0.3, 0.5, 0.7, 1]}
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={{ flex: 1 }}
                          />
                        </Animated.View>
                      </View>
                    )}
                  </View>

                  {isEvolved ? (
                    <View className="flex-row items-center justify-center mt-6 gap-2">
                      <StarIcon size={20} color="black" />
                      <Text className="text-center text-gray-600 italic">
                        Poka’s proud of you — Lv. 2 unlocked!
                      </Text>
                    </View>
                  ) : (
                    <>
                      {!isEvolved && (cardCount === 1 || cardCount < 10) && (
                        <View className="flex-row items-center justify-between">
                          <Stepper
                            key={cardCount}
                            totalSteps={10}
                            currentStep={stepperCardCount}
                          />
                          <ArrowRightIcon size={18} color="black" />
                          <Text className="text-sm font-semibold"> Lv. 2</Text>
                        </View>
                      )}
                      <Text className="text-center text-gray-600 italic mt-6 mr-10 ml-10">
                        {cardQuote}
                      </Text>
                    </>
                  )}
                </View>
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
