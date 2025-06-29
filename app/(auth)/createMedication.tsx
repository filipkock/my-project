import { View, SafeAreaView } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useRouter } from "expo-router";
import { setOnboardingStatus } from "~/src/utils/onboarding";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import StartImage from "~/assets/images/poka_excited.svg";

export default function CreateMedication() {
  const router = useRouter();

  const handleCreateMedication = () => {
    // Mark onboarding as complete and navigate to medication creation
    setOnboardingStatus(true).then(() => {
      router.replace("/(app)/addNewMedication/step1");
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 p-12">
        <View className="flex-row justify-between items-center mb-8">
          <ChevronLeft
            size={32}
            color="black"
            onPress={() => router.push("../allowNotification")}
          />
          <Text
            className="text-sm text-muted-foreground "
            onPress={() => router.replace("/(app)/(tabs)/(home)")}
          >
            Skip
          </Text>
        </View>
        <View className="flex-1 justify-between items-center py-10 mt-4">
          <Text className="text-3xl font-bold text-center">
            Let’s get started!
          </Text>
          <StartImage width={230} height={230} />
          <Text className="text-center">
            Start by creating your first medication to begin tracking your
            doses.
          </Text>
        </View>
        <Button className="w-full" onPress={handleCreateMedication}>
          <Text>Create Medication</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
}
