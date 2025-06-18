import React from "react";
import { View, SafeAreaView, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import {
  cardImages,
  cardNames,
  cardCollections,
} from "~/src/constants/cardMap";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LockClosedIcon } from "react-native-heroicons/outline";
import Toast from "react-native-toast-message";

const collection = () => {
  const router = useRouter();
  const unlockedCards = [1, 2, 3, 5, 6]; // Replace this with actual unlocked card IDs

  const groupedCards = Object.entries(cardNames).reduce((acc, [id, name]) => {
    const collection = cardCollections[parseInt(id)];
    if (!acc[collection]) acc[collection] = [];
    acc[collection].push({ id: parseInt(id), name });
    return acc;
  }, {} as Record<string, { id: number; name: string }[]>);

  const handleCardPress = (id: number, isUnlocked: boolean) => {
    if (isUnlocked) {
      router.push({
        pathname: "/(app)/(tabs)/(collection)/details/details",
        params: { id: id.toString() },
      });
    } else {
      Toast.show({
        type: "plain",
        text1: "Card Locked",
        text2: "Unlock this card by taking your medications!",
      });
    }
  };

  return (
    <SafeAreaView className="flex-1">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xl font-bold mb-4">Collection</Text>
        {Object.entries(groupedCards).map(([collectionName, cards]) => (
          <View key={collectionName} className="mb-8">
            <Text className="text-md font-semibold mb-4">{collectionName}</Text>
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
