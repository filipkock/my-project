import React, { useEffect, useState } from "react";
import { SafeAreaView, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import EditMedicationForm from "~/app/(app)/medicationList/EditMedicationForm";
import { Text } from "~/components/ui/text";
import LottieView from "lottie-react-native";
import { ChevronLeftIcon } from "react-native-heroicons/solid";

const EditMedicationScreen = () => {
  const { medication } = useLocalSearchParams<{ medication: string }>();
  const [medicationState, setMedication] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!medication) return;

    const parsed = JSON.parse(medication);
    setMedication({
      ...parsed,
      startDate: new Date(parsed.startDate.seconds * 1000),
      endDate: new Date(parsed.endDate.seconds * 1000),
    });

    setLoading(false);
  }, [medication]);

  const handleSuccess = () => {
    router.replace("/(app)/(tabs)/(medications)");
  };

  const handlePress = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="p-6">
        <ChevronLeftIcon size={32} color="black" onPress={handlePress} />

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <LottieView
              source={require("~/assets/animations/loading.json")}
              style={{ width: 250, height: 250 }}
              autoPlay
              loop
            />
          </View>
        ) : !medicationState ? (
          <View className="flex-1 justify-center items-center">
            <Text>Medication not found</Text>
          </View>
        ) : (
          <EditMedicationForm
            defaultValues={medicationState}
            onSuccess={handleSuccess}
            onCancel={() => router.back()}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default EditMedicationScreen;
