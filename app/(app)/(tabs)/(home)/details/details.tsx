import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "~/components/ui/text";
import { Card } from "~/components/ui/card";
import moment from "moment";
import type { Medication } from "~/types/medication";
import { Timestamp } from "firebase/firestore";

export default function MedicationDetails() {
  const { medication } = useLocalSearchParams<{ medication: string }>();
  const [status, setStatus] = useState<"TAKE NOW" | "PAST DOSE" | "FUTURE DOSE">("TAKE NOW");
  
  const parsedData = JSON.parse(medication);
  const medData: Medication = {
    ...parsedData,
    date: new Timestamp(parsedData.date.seconds, parsedData.date.nanoseconds)
  };

  useEffect(() => {
    calculateStatus();
  }, [medData]);

  const calculateStatus = () => {
    const now = new Date();
    const scheduledTime = medData.date.toDate();
    const [hours, minutes] = medData.reminderTime.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const isToday = moment(scheduledTime).isSame(now, 'day');
    const isPast = now > scheduledTime;
    
    if (isToday && medData.status !== "taken") {
      setStatus("TAKE NOW");
    } else if (isPast) {
      setStatus("PAST DOSE");
    } else {
      setStatus("FUTURE DOSE");
    }
  };

  const formatScheduledTime = () => {
    const scheduledTime = medData.date.toDate();
    const [hours, minutes] = medData.reminderTime.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    const isToday = moment(scheduledTime).isSame(new Date(), 'day');
    const timeStr = moment(scheduledTime).format("HH:mm");
    return `Scheduled for ${timeStr}, ${isToday ? "today" : moment(scheduledTime).format("MMMM D")}`;
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-4">
        <Text className="text-3xl font-bold mb-6">{medData.medicationName}</Text>
        
        <Card className="p-4 mb-4">
          <Text className={`text-lg font-bold mb-2 ${
            status === "TAKE NOW" ? "text-green-500" :
            status === "PAST DOSE" ? "text-red-500" :
            "text-blue-500"
          }`}>
            {status}
          </Text>
        </Card>

        <Card className="p-4 mb-4">
          <Text className="text-lg">{formatScheduledTime()}</Text>
        </Card>

        <Card className="p-4">
          <Text className="text-lg">
            Take {medData.dosageAmount || 1} {medData.dosageUnit || "pill"}
            {medData.dosageStrength ? `, ${medData.dosageStrength}` : ""}
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
} 