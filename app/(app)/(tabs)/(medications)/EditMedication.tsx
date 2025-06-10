import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AddMedicationForm from "~/app/(app)/addNewMedication/addMedicationForm";
import { Text } from "~/components/ui/text";

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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!medicationState) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Medication not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-6">
      <AddMedicationForm
        defaultValues={medicationState}
        onSuccess={handleSuccess}
        onCancel={() => router.back()}
      />
    </View>
  );
};

export default EditMedicationScreen;
