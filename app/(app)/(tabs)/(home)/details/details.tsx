import React, { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "~/components/ui/text";
import { Card } from "~/components/ui/card";
import moment from "moment";
import type { Medication } from "~/types/medication";
import { Timestamp, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "~/config/firebase";

export default function MedicationDetails() {
  const { medication } = useLocalSearchParams<{ medication: string }>();
  const [status, setStatus] = useState<"TAKE NOW" | "PAST DOSE" | "FUTURE DOSE">("TAKE NOW");
  const [lastTakenInfo, setLastTakenInfo] = useState<string | null>(null);
  
  const parsedData = JSON.parse(medication);
  const medData: Medication = {
    ...parsedData,
    date: new Timestamp(parsedData.date.seconds, parsedData.date.nanoseconds)
  };

  useEffect(() => {
    calculateStatus();
    fetchLastTakenReminder();
  }, [medData]);

  const fetchLastTakenReminder = async () => {
    try {
      // Calculate the current reminder's scheduled datetime
      const scheduledTime = medData.date.toDate();
      const [hours, minutes] = medData.reminderTime.split(":").map(Number);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Query all taken reminders for this medication
      const remindersRef = collection(db, "reminders");
      const q = query(
        remindersRef,
        where("medId", "==", medData.medDocID),
        where("status", "==", "taken"),
        orderBy("takenTime", "desc")
      );

      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Find the most recent reminder that was taken before the current scheduled time
        let closestReminder = null;
        let minTimeDiff = Infinity;

        querySnapshot.forEach((doc) => {
          const reminder = doc.data();
          const takenTime = reminder.takenTime.toDate();
          
          // Only consider reminders taken before the current scheduled time
          if (takenTime < scheduledTime) {
            const timeDiff = scheduledTime.getTime() - takenTime.getTime();
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              closestReminder = reminder;
            }
          }
        });

        if (closestReminder) {
          const takenTime = closestReminder.takenTime.toDate();
          const formattedTime = moment(takenTime).format("HH:mm");
          const formattedDate = moment(takenTime).format("MMMM D");
          setLastTakenInfo(`Previously taken at ${formattedTime} on ${formattedDate}`);
        } else {
          setLastTakenInfo(null);
        }
      } else {
        setLastTakenInfo(null);
      }
    } catch (error) {
      console.error("Error fetching last taken reminder:", error);
      setLastTakenInfo(null);
    }
  };

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

        <Card className="p-4 mb-4">
          <Text className="text-lg">
            Take {medData.dosageAmount || 1} {medData.dosageUnit || "pill"}
            {medData.dosageStrength ? `, ${medData.dosageStrength}` : ""}
          </Text>
        </Card>

        {lastTakenInfo && (
          <Card className="p-4">
            <Text className="text-lg text-gray-600">{lastTakenInfo}</Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
} 