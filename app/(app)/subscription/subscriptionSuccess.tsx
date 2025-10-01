import React from "react";
import { SafeAreaView, View, Image } from "react-native";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import { XMarkIcon } from "react-native-heroicons/solid";
import Star from "~/assets/static/star.svg";

const SubscriptionSuccess = () => {
  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 w-full p-6">
        <XMarkIcon size={28} color="#222" onPress={() => router.push("/")} />

        {/* Header and confirmation */}
        <View className="px-6 pt-8 pb-4 items-center gap-4">
          <Text className="text-md text-muted-foreground">Congratulations</Text>
          <Text className="text-4xl pb-10 font-bold text-center">
            You now have Poka Premium
          </Text>

          {/* Centered Image */}
          <Star width={300} height={300} />
        </View>
      </View>

      <View className="px-6 pb-6 pt-2 bg-secondary/40">
        <Button
          variant="default"
          className="w-full"
          onPress={() => router.push("/")}
        >
          <Text>Continue</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default SubscriptionSuccess;
