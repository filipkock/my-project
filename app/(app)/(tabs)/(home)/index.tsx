import React, { useEffect, useState } from "react";
import { SafeAreaView, View, ScrollView } from "react-native";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Plus } from "~/lib/icons/plus";
import { router } from "expo-router";
import { getFromStorage } from "~/services/storage";
import { User } from "firebase/auth";

export default function Screen() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getUserDetails();
  }, []);

  const getUserDetails = async () => {
    const userInfo = await getFromStorage("userDetails");
    setUser(userInfo);
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/30">
      <ScrollView
        contentContainerStyle={{ alignItems: "center" }}
        className="w-full"
      >
        <View className="gap-5 p-6 w-full items-center">
          <Card className="w-full rounded-2xl max-w-sm">
            <CardHeader>
              <CardTitle> Good morning {user?.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="text-base mb-5">
                No medications added. Get started and add one now!
              </Text>
              <Button
                className="flex-1 flex-row gap-2"
                onPress={() => router.push("/addNewMedication/main")}
              >
                <Plus size={22} color="white" />
                <Text>Add medication</Text>
              </Button>
            </CardContent>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
