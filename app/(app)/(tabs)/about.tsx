import React from "react";
import { View, SafeAreaView } from "react-native";
import { Text } from "~/components/ui/text";

const about = () => {
  return (
    <SafeAreaView className="flex-1 p-8">
      <View className="flex-1 w-full p-10">
        <Text className="text-xl">
          This is our little app, read more about us here
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default about;
