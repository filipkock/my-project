import { Link, Stack } from "expo-router";
import { View, SafeAreaView } from "react-native";
import { Text } from "~/components/ui/text";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <SafeAreaView className="flex-1 justify-center items-center p-6 bg-background">
        <View className="items-center gap-4">
          <Text className="text-lg">This screen doesn't exist.</Text>
          <Link href="./">
            <Text className="text-blue-500 underline">Go to home screen!</Text>
          </Link>
        </View>
      </SafeAreaView>
    </>
  );
}
