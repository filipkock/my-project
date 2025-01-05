import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";

const Details = () => {
  const { id } = useLocalSearchParams();
  return (
    <View className="flex-1 pt-5 pl-5">
      <Text className="text-xl">medication - {id}</Text>
    </View>
  );
};

export default Details;
