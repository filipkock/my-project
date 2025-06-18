import React from "react";
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
import { ChevronLeftIcon } from "react-native-heroicons/solid";

export default function CardDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cardId = id ? parseInt(id, 10) : undefined;
  const name = cardId !== undefined ? cardNames[cardId] : undefined;
  const collection = cardId !== undefined ? cardCollections[cardId] : undefined;
  const CardImage = cardId !== undefined ? cardImages[cardId] : undefined;
  const quote = cardId !== undefined ? cardQuotes[cardId] : undefined;

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
            onPress={() => router.replace("/(app)/(tabs)/(collection)")}
            className="p-2"
          >
            <ChevronLeftIcon size={28} color="#111" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 justify-center items-center gap-1">
          <View className="items-start gap-2">
            <View className="flex-col items-center gap-1">
              <Text className="text-3xl font-semibold text-gray-900">
                {name}
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
              <CardImage width={200} height={200} />
            ) : (
              <Text>No card image found</Text>
            )}
          </View>
          {quote && (
            <Text className="text-center text-gray-600 italic mt-10">
              {quote}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
