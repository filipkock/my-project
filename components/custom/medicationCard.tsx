import { View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import { Text } from "~/components/ui/text";

interface Medication {
  medicationName: string;
  medicationType: string;
  reminderTime: string;
  whenToTake: string;
}

const medicationCard = ({ medication }: { medication: Medication }) => {
  return (
    <View className="m-6">
      <Card className="w-full rounded-2xl max-w-sm">
        <CardHeader>
          <CardTitle> {medication.medicationName}</CardTitle>
        </CardHeader>
        <CardContent>
          <Text className="text-base mb-5">{medication.medicationType}</Text>
          <Button
            className="flex-1 flex-row gap-2"
            // onPress={() => router.push("/addNewMedication")}
          >
            <Text>View medication</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
};

export default medicationCard;
