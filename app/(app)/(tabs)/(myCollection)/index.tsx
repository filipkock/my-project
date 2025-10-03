import { useEffect, useState } from "react";
import { auth, db } from "~/config/firebase";
import { doc, getDoc } from "firebase/firestore";
import React from "react";
import { View, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import {
  cardImages,
  cardNames,
  cardCollections,
  PREMIUM_COLLECTIONS,
} from "~/src/constants/cardMap";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LockClosedIcon } from "react-native-heroicons/outline";
import Toast from "react-native-toast-message";
import { Badge } from "~/components/ui/badge";
import { usePremiumGate } from "~/src/hooks/usePremiumGate";

const collection = () => {
  const router = useRouter();
  const [unlockedCards, setUnlockedCards] = useState<number[]>([]);
  const { isPremium } = usePremiumGate();

  useEffect(() => {
    const fetchUnlockedCards = async () => {
      if (!auth.currentUser) return;

      const userCardsRef = doc(db, "userCards", auth.currentUser.uid);
      const userCardsSnap = await getDoc(userCardsRef);

      if (userCardsSnap.exists()) {
        const userCardsData = userCardsSnap.data();
        const unlocked = Object.keys(userCardsData.cards || {}).map(Number);
        setUnlockedCards(unlocked);
      }
    };

    fetchUnlockedCards();
  }, []);

  const groupedCards = Object.entries(cardNames).reduce((acc, [id, name]) => {
    const collection = cardCollections[parseInt(id)];
    if (!acc[collection]) acc[collection] = [];
    acc[collection].push({ id: parseInt(id), name });
    return acc;
  }, {} as Record<string, { id: number; name: string }[]>);

  const handleCardPress = (id: number, isUnlocked: boolean) => {
    const collectionName = cardCollections[id];
    const isCollectionPremium = PREMIUM_COLLECTIONS.has(collectionName);

    if (isUnlocked) {
      router.push({
        pathname: "/(app)/collectionDetails/details",
        params: { id: id.toString() },
      });
      return;
    }

    if (!isPremium && isCollectionPremium) {
      Toast.show({
        type: "plain",
        text1: "Premium feature",
        text2: "Upgrade to Premium to unlock this collection.",
      });
      return;
    }

    Toast.show({
      type: "plain",
      text1: "Card Locked",
      text2: "Unlock this card by taking your medications!",
    });
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 32 }}>
        <Text className="text-xl font-bold mb-4">Collection</Text>
        {Object.entries(groupedCards).map(([collectionName, cards]) => (
          <View key={collectionName} className="mb-8">
            <View className="flex-row items-center gap-2 mb-4">
              <Text className="text-md font-semibold">{collectionName}</Text>
              {!isPremium && PREMIUM_COLLECTIONS.has(collectionName) && (
                <Badge>
                  <Text className="text-xs">Premium collection</Text>
                </Badge>
              )}
            </View>
            <View className="flex-row flex-wrap -mx-2">
              {cards.map(({ id, name }) => {
                const isUnlocked = unlockedCards.includes(id);
                const CardImage = cardImages[id];
                return (
                  <TouchableOpacity
                    key={id}
                    className="w-1/2 px-2 mb-4"
                    onPress={() => handleCardPress(id, isUnlocked)}
                    style={{ opacity: isUnlocked ? 1 : 0.5 }}
                  >
                    <Card className="h-48">
                      <CardHeader>
                        <CardTitle>{name}</CardTitle>
                      </CardHeader>
                      <CardContent className="items-center justify-center flex-1">
                        {isUnlocked && CardImage ? (
                          <CardImage width={64} height={64} />
                        ) : (
                          <LockClosedIcon size={32} color="#9CA3AF" />
                        )}
                      </CardContent>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default collection;
