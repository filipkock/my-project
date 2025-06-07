import React, { useState } from "react";
import { SafeAreaView, View } from "react-native";
import MedicationList from "~/components/custom/medicationList";
import type { Medication } from "~/src/types/medication";

export default function Screen() {
  const [medications, setMedications] = useState<Medication[]>([]);

  const handleMedicationUpdate = (medication: Medication) => {
    setMedications(prev => 
      prev.map(med => med.medDocID === medication.medDocID ? medication : med)
    );
  };

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 w-full">
        <MedicationList 
          medications={medications}
          onMedicationUpdate={handleMedicationUpdate}
        />
      </View>
    </SafeAreaView>
  );
}
