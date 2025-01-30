import { router } from "expo-router";
import { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { Plus } from "~/lib/icons/plus";
import { getFromStorage } from "~/services/storage";

const index = () => {
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
      <View className="flex-1 w-full p-10">
        {/* Create new medication section */}
        <Card className="w-full rounded-2xl">
          <CardHeader>
            <CardTitle> Good morning {user?.displayName}</CardTitle>
          </CardHeader>
          <CardContent>
            <Text className="text-base mb-5">
              No medications added. Get started and add one now!
            </Text>
            <Button
              variant={"default"}
              className="w-full flex flex-row gap-3"
              onPress={() => router.push("/addNewMedication/main")}
            >
              <Plus size={22} color="white" />
              <Text>Add medication</Text>
            </Button>
          </CardContent>
        </Card>
      </View>
    </SafeAreaView>
  );
};

export default index;
