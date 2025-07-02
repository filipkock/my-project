import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "~/src/context/auth"; // Adjust path if needed
import { View, SafeAreaView } from "react-native";
import { Button } from "~/components/ui/button";
import { Text } from "~/components/ui/text";
import { useRouter } from "expo-router";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import StartImage from "~/assets/images/poka_excited.svg";
import { useEffect } from "react";
import { getDocs, collection, query, limit } from "firebase/firestore";
import { db } from "~/config/firebase";
import { getAuth } from "firebase/auth";

export default function CreateMedication() {
  const router = useRouter();
  const { setHasCompletedOnboarding } = useAuth();

  useEffect(() => {
    const checkForMedications = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) return;

      const medsRef = collection(db, "users", user.uid, "medication");
      const medsQuery = query(medsRef, limit(1));
      const medsSnap = await getDocs(medsQuery);
      if (!medsSnap.empty) {
        router.replace("/(app)/(tabs)/(home)");
      }
    };

    checkForMedications();
  }, []);

  const handleCreateMedication = async () => {
    await AsyncStorage.setItem("hasCompletedOnboarding", "true");
    setHasCompletedOnboarding(true);
    router.replace("/(app)/addNewMedication/step1");
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
            onPress={async () => {
              await AsyncStorage.setItem("hasCompletedOnboarding", "true");
              setHasCompletedOnboarding(true);
              router.replace("/(app)/(tabs)/(home)");
            }}
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
