import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert, Platform } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Text } from "~/components/ui/text";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import moment from "moment";
import type { Medication } from "~/types/medication";
import { Timestamp, collection, query, where, orderBy, limit, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "~/config/firebase";

export default function MedicationDetails() {
  const { medication } = useLocalSearchParams<{ medication: string }>();
  const [localMed, setLocalMed] = useState<Medication>(() => {
    const parsed = JSON.parse(medication);
    return {
      ...parsed,
      date: new Timestamp(parsed.date.seconds, parsed.date.nanoseconds)
    };
  });
  const [lastTakenInfo, setLastTakenInfo] = useState<string | null>(null);

  useEffect(() => {
    calculateStatus();
    fetchLastTakenReminder();
  }, [localMed]);

  const calculateStatus = () => {
    const now = new Date();
    const scheduledTime = localMed.date.toDate();
    const [hours, minutes] = localMed.reminderTime.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const isToday = moment(scheduledTime).isSame(now, 'day');
    const isPast = now > scheduledTime;
    
    if (localMed.status === "taken") {
      return "TAKEN";
    } else if (isToday) {
      return "TAKE NOW";
    } else if (isPast) {
      return "PAST DOSE";
    } else {
      return "FUTURE DOSE";
    }
  };

  const handleTakeMedication = async () => {
    const now = new Date();
    const scheduledTime = localMed.date.toDate();
    const [hours, minutes] = localMed.reminderTime.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);

    const diffMinutes = Math.abs(now.getTime() - scheduledTime.getTime()) / 60000;
    const isSameDay = scheduledTime.toDateString() === now.toDateString();
    const withinOneHr = diffMinutes <= 60;
    const onTime = isSameDay && withinOneHr;

    try {
      // Update Firestore
      const reminderRef = doc(db, "reminders", localMed.reminderDocID);
      await updateDoc(reminderRef, {
        status: "taken",
        takenTime: Timestamp.fromDate(now),
        onTime: onTime
      });

      // Update local state
      setLocalMed(prev => ({
        ...prev,
        status: "taken",
        takenTime: Timestamp.fromDate(now),
        onTime: onTime
      }));

      if (onTime) {
        // Trigger reward logic if available
        // showReward();
      }

      // Refresh last taken info
      await fetchLastTakenReminder();
    } catch (error) {
      console.error("Error marking medication as taken:", error);
      Alert.alert("Error", "Failed to mark medication as taken. Please try again.");
    }
  };

  const handleUndoMedication = async () => {
    try {
      // Update Firestore
      const reminderRef = doc(db, "reminders", localMed.reminderDocID);
      await updateDoc(reminderRef, {
        status: "pending",
        takenTime: null,
        onTime: null
      });

      // Update local state
      setLocalMed(prev => ({
        ...prev,
        status: "pending",
        takenTime: null,
        onTime: null
      }));

      // Refresh last taken info
      await fetchLastTakenReminder();
    } catch (error) {
      console.error("Error undoing medication:", error);
      Alert.alert("Error", "Failed to undo medication. Please try again.");
    }
  };

  const formatScheduledTime = () => {
    const scheduledTime = localMed.date.toDate();
    const [hours, minutes] = localMed.reminderTime.split(":").map(Number);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    const isToday = moment(scheduledTime).isSame(new Date(), 'day');
    const timeStr = moment(scheduledTime).format("HH:mm");
    return `Scheduled for ${timeStr}, ${isToday ? "today" : moment(scheduledTime).format("MMMM D")}`;
  };

  const formatTakenTime = () => {
    if (!localMed.takenTime) return null;
    const takenTime = typeof localMed.takenTime === 'object' && 'toDate' in localMed.takenTime 
      ? localMed.takenTime.toDate()
      : new Date(localMed.takenTime);
    return `Taken at ${moment(takenTime).format("HH:mm")}`;
  };

  const fetchLastTakenReminder = async () => {
    try {
      // Calculate the current reminder's scheduled datetime
      const scheduledTime = localMed.date.toDate();
      const [hours, minutes] = localMed.reminderTime.split(":").map(Number);
      scheduledTime.setHours(hours, minutes, 0, 0);

      // Query all taken reminders for this medication
      const remindersRef = collection(db, "reminders");
      const q = query(
        remindersRef,
        where("medId", "==", localMed.medDocID),
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
          const takenTime = (closestReminder as any).takenTime.toDate();
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

  return (
    <View className="flex-1 bg-background">
      <ScrollView className="flex-1">
        <View className="p-10 space-y-6">
          <Badge variant="default" className="self-start">
            <Text className="text-xs font-medium">{calculateStatus()}</Text>
          </Badge>
          
          <Text className="text-3xl font-bold">{localMed.medicationName}</Text>

          <View className="flex-row items-center space-x-3">
            {/* Add relevant icons here later */}
            <Text className="text-base">{formatScheduledTime()}</Text>
          </View>

          <View className="flex-row items-center space-x-3">
            <Text className="text-base">
              Take {localMed.dosageAmount || 1} {localMed.dosageUnit || "pill"}
              {localMed.dosageStrength ? `, ${localMed.dosageStrength}` : ""}
            </Text>
          </View>

          {formatTakenTime() && (
            <View className="flex-row items-center space-x-3">
              <Text className="text-base text-muted-foreground">{formatTakenTime()}</Text>
            </View>
          )}

          {lastTakenInfo && localMed.status !== "taken" && (
            <View className="flex-row items-center space-x-3">
              <Text className="text-base text-muted-foreground">{lastTakenInfo}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="p-4 border-t border-border bg-background">
        <Button 
          onPress={localMed.status === "taken" ? handleUndoMedication : handleTakeMedication}
          className="w-full"
          variant={localMed.status === "taken" ? "outline" : "default"}
        >
          <Text className={localMed.status === "taken" ? "text-foreground" : "text-white"}>
            {localMed.status === "taken" ? "Undo Medication" : "Take Medication"}
          </Text>
        </Button>
      </View>
    </View>
  );
}