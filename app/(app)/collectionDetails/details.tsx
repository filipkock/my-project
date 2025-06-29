import React, { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "~/config/firebase";
import { getFromStorage } from "~/src/services/storage";
import { View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import {
  cardImages,
  cardNames,
  cardCollections,
  cardQuotes,
} from "~/src/constants/cardMap";
import {
  ChevronLeftIcon,
  StarIcon,
  ArrowRightIcon,
} from "react-native-heroicons/solid";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Stepper } from "~/components/custom/Stepper";

export default function CardDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cardId = id ? parseInt(id, 10) : undefined;
  const name = cardId !== undefined ? cardNames[cardId] : undefined;
  const collection = cardId !== undefined ? cardCollections[cardId] : undefined;
  const CardImage = cardId !== undefined ? cardImages[cardId] : undefined;
  const quote = cardId !== undefined ? cardQuotes[cardId] : undefined;

  const [cardCount, setCardCount] = useState(0);
  const [isEvolved, setIsEvolved] = useState(false);
  const shimmerTranslateX = useSharedValue(-300);

  useEffect(() => {
    if (cardId) {
      (async () => {
        const user = await getFromStorage("userDetails");
        if (!user?.uid) return;

        const ref = doc(db, "userCards", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const userCards = snap.data();
          const count = userCards.cards?.[cardId] ?? 0;
          setCardCount(count);
          setIsEvolved(count >= 10);
        }
      })();
    }
  }, [cardId]);

  useEffect(() => {
    if (isEvolved) {
      shimmerTranslateX.value = withRepeat(
        withTiming(600, { duration: 3000 }),
        -1,
        false
      );
    }
  }, [isEvolved]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  if (!cardId || !name || !collection) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-lg">Card not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 items-center p-6 w-full">
        <View className="w-full flex-row items-center mb-4">
          <TouchableOpacity
            onPress={() => router.replace("/(app)/(tabs)/(myCollection)")}
            className="p-2"
          >
            <ChevronLeftIcon size={28} color="#111" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center gap-1">
          <View className="items-start gap-2">
            <View className="flex-col items-center gap-1">
              <Text className="text-3xl font-semibold text-gray-900">
                {cardNames[cardId]} {isEvolved ? "Lv. 2" : "Lv. 1"}
              </Text>
              <Text className="text-sm text-gray-500">
                {collection} collection
              </Text>
            </View>
          </View>
          <View
            style={{ width: 300, height: 300 }}
            className="justify-center items-center mt-4"
          >
            {CardImage ? (
              <View className="rounded-xl p-6 relative justify-center items-center">
                <View className="relative z-10">
                  <CardImage width={200} height={200} />
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
            ) : (
              <Text>No card image found</Text>
            )}
          </View>
          {quote && (
            <>
              {!isEvolved ? (
                <>
                  <View className="flex-row items-center justify-between">
                    <Stepper
                      key={cardCount}
                      totalSteps={10}
                      currentStep={cardCount}
                    />
                    <ArrowRightIcon size={18} color="black" />
                    <Text className="text-sm font-semibold"> Lv. 2</Text>
                  </View>
                </>
              ) : (
                <View className="flex-row items-center justify-center mt-4 gap-2">
                  <StarIcon size={20} color="black" />
                  <Text className="text-center text-gray-600 ">
                    Lv. 2 unlocked - Poka’s feeling proud of you!
                  </Text>
                </View>
              )}
              <Text className="text-center text-gray-600 italic mt-4">
                {quote}
              </Text>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
