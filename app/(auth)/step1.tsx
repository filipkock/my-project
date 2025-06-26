import React from "react";
import { SafeAreaView, View, Image } from "react-native";
import { router } from "expo-router";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";

export default function Step1() {
  const handleContinue = () => {
    router.push("/(auth)/signup");
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-1 gap-10">
          <Image
            source={require("~/assets/images/logo.png")}
            className="w-20 h-20"
            resizeMode="contain"
          />

          <Text className="text-3xl font-bold mb-4">
            LEt's make medication taking fun!
          </Text>
        </View>
        <View className="">
          <Button className="w-full" onPress={handleContinue}>
            <Text>Continue</Text>
          </Button>
          <Text className="text-xs text-center text-muted-foreground mt-5">
            By continuing, you agree to our terms and services.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
