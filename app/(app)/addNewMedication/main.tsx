import { router } from "expo-router";
import {
  Keyboard,
  SafeAreaView,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Text } from "~/components/ui/text";
import { ChevronLeft } from "~/lib/icons/ChevronLeft";
import AddMedicationForm from "./addMedicationForm";

export default function AddNewMedication() {
  return (
    <TouchableWithoutFeedback
      style={{ height: "100%", width: "100%" }}
      onPress={() => {
        Keyboard.dismiss(); // Dismiss keyboard
      }}
    >
      <SafeAreaView className="flex-1 bg-secondary/30">
        <View className="flex-1">
          <View className="absolute top-0 left-0 p-6">
            <ChevronLeft
              size={32}
              color="black"
              onPress={() => router.back()}
            />
          </View>
          <View className="flex-1 justify-center items-center p-6">
            <AddMedicationForm />
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}
