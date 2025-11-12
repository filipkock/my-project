import { SafeAreaView, View, ScrollView } from "react-native";
import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { ChevronLeftIcon } from "react-native-heroicons/solid";
import { FirestoreMedication } from "~/src/types/medication";

const toDisplayDate = (
  v?:
    | string
    | Date
    | { toDate: () => Date }
    | { seconds?: number; nanoseconds?: number }
) => {
  if (!v) return "–";
  try {
    let d: Date;
    if (typeof v === "string") {
      d = new Date(v);
    } else if (v instanceof Date) {
      d = v;
    } else if (typeof v === "object") {
      if (typeof (v as any).toDate === "function") {
        d = (v as any).toDate();
      } else if (
        typeof (v as any).seconds === "number" &&
        typeof (v as any).nanoseconds === "number"
      ) {
        const ms = (v as any).seconds * 1000 + (v as any).nanoseconds / 1e6;
        d = new Date(ms);
      } else {
        return "–";
      }
    } else {
      return "–";
    }
    return d.toLocaleDateString();
  } catch {
    return "–";
  }
};

export default function MedicationDetails() {
  const { medication } = useLocalSearchParams();
  const navigation = useNavigation();
  const [parsedMedication, setParsedMedication] = useState<
    (FirestoreMedication & { id?: string }) | null
  >(null);

  useEffect(() => {
    if (medication && typeof medication === "string") {
      try {
        const parsed = JSON.parse(medication) as FirestoreMedication & {
          id?: string;
        };
        setParsedMedication(parsed);
      } catch (error) {
        console.error("Failed to parse medication param:", error);
      }
    }
  }, [medication]);

  if (!parsedMedication) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-center text-lg">No medication found.</Text>
      </View>
    );
  }

  const handlePress = () => {
    router.push({
      pathname: "/(app)/(tabs)/(medications)",
    });
  };

  const intake = parsedMedication.intakeInterval?.toLowerCase().trim();
  const showCustomInterval =
    !!parsedMedication.customInterval &&
    (intake === "Every other day" ||
      intake === "Every other week" ||
      intake === "Every other month");

  // Layout constants for header/footer heights to offset scroll area
  const HEADER_HEIGHT = 56; // px
  const FOOTER_HEIGHT = 80; // px

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        {/* Fixed header with back icon */}
        <View
          style={{ height: HEADER_HEIGHT }}
          className="px-8 flex-row items-center "
        >
          <ChevronLeftIcon size={28} color="black" onPress={handlePress} />
        </View>

        {/* Scrollable content (title + fields) */}
        <ScrollView
          className="flex-1 p-6 pt-10 pb-24"
          contentContainerStyle={{ paddingBottom: FOOTER_HEIGHT + 16 }}
        >
          <View className="mt-2 px-8 gap-3">
            <Text className="text-4xl font-bold mb-4 uppercase">
              {parsedMedication.medicationName}
            </Text>

            <View>
              <Label className="text-gray-500 mb-1">Type</Label>
              <Text className="text-lg">{parsedMedication.medicationType}</Text>
            </View>

            <View>
              <Label className="text-gray-500 mb-1">Interval</Label>
              <Text className="text-lg">{parsedMedication.intakeInterval}</Text>
            </View>

            <View>
              <Label className="text-gray-500 mb-1">Times</Label>
              <Text className="text-lg">
                {parsedMedication.reminderTimes?.join(", ")}
              </Text>
            </View>

            {showCustomInterval && (
              <View>
                <Label className="text-gray-500 mb-1">Custom Interval</Label>
                <Text className="text-lg">
                  {parsedMedication.customInterval}
                </Text>
              </View>
            )}

            <View>
              <Label className="text-gray-500 mb-1">Start Date</Label>
              <Text className="text-lg">
                {toDisplayDate(parsedMedication.startDate as any)}
              </Text>
            </View>

            <View>
              <Label className="text-gray-500 mb-1">End Date</Label>
              <Text className="text-lg">
                {parsedMedication.endDate
                  ? toDisplayDate(parsedMedication.endDate as any)
                  : "no end date (take forever)"}
              </Text>
            </View>

            {intake === "specific days weekly" &&
              !!parsedMedication.specificDaysOfWeek?.length && (
                <View>
                  <Label className="text-gray-500 mb-1">
                    Specific Days of Week
                  </Label>
                  <Text className="text-lg">
                    {parsedMedication.specificDaysOfWeek.join(", ")}
                  </Text>
                </View>
              )}
          </View>
        </ScrollView>

        {/* Fixed footer with button */}
        <View style={{ height: FOOTER_HEIGHT }} className="px-8 justify-center">
          <Button
            onPress={() =>
              router.push({
                pathname: "/medicationList/editMedication",
                params: { medication: JSON.stringify(parsedMedication) },
              })
            }
          >
            <Text>Edit Medication</Text>
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
