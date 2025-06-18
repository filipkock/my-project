import React from "react";
import { View, SafeAreaView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "~/components/ui/text";
import {
  cardImages,
  cardNames,
  cardCollections,
} from "~/src/constants/cardMap";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default function CardDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cardId = id ? parseInt(id, 10) : undefined;
  const name = cardId !== undefined ? cardNames[cardId] : undefined;
  const collection = cardId !== undefined ? cardCollections[cardId] : undefined;
  const CardImage = cardId !== undefined ? cardImages[cardId] : undefined;

  if (!cardId || !name || !collection) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-lg">Card not found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{name}</CardTitle>
          <Text className="text-gray-500">{collection}</Text>
        </CardHeader>
        <CardContent className="items-center justify-center flex-1">
          {CardImage ? <CardImage width={128} height={128} /> : null}
        </CardContent>
      </Card>
    </SafeAreaView>
  );
}
