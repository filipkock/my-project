import React, { useEffect, useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Text } from "~/components/ui/text";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import moment from "moment";
import type { Medication } from "~/src/types/medication";
import { Timestamp, collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "~/config/firebase";
import { 
  getScheduledDate, 
  handleTakeMedication, 
  handleUntakeMedication 
} from "~/src/utils/medicationActions";
import DateTimePickerModal from "~/components/custom/DateTimePickerModal";

export default function MedicationDetails() {
  const { medication } = useLocalSearchParams<{ medication: string }>();
  const router = useRouter();
  const [localMed, setLocalMed] = useState<Medication>(() => {
    const parsed = JSON.parse(medication);
    return {
      ...parsed,
      date: new Timestamp(parsed.date.seconds, parsed.date.nanoseconds)
    };
  });
  const [lastTakenInfo, setLastTakenInfo] = useState<string | null>(null);
  const [dateTimePickerValue, setDateTimePickerValue] = useState<Date>(new Date());
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);

  useEffect(() => {
    calculateStatus();
    fetchLastTakenReminder();
  }, [localMed]);

  const calculateStatus = () => {
    const now = new Date();
    const scheduledTime = getScheduledDate(localMed);
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

  const openDateTimePicker = (initialDate: Date): Promise<Date | null> => {
    return new Promise((resolve) => {
      setDateTimePickerValue(initialDate);
      setDateTimePickerVisible(true);
      const handleChange = (date: Date | null) => {
        setDateTimePickerVisible(false);
        resolve(date);
      };
      // Store the callback in a ref or state if needed
      // For now, we'll just use the modal's onChange prop
    });
  };

  const handleMedicationAction = async () => {
    if (localMed.status === "taken") {
      await handleUntakeMedication(localMed, {
        onSuccess: (takenTime, onTime) => {
          setLocalMed(prev => ({
            ...prev,
            status: "pending",
            takenTime: null,
            onTime: null
          }));
          fetchLastTakenReminder();
        },
        onError: (error) => {
          console.error("Error undoing medication:", error);
          Alert.alert("Error", "Failed to undo medication. Please try again.");
        },
        openDateTimePicker
      });
    } else {
      await handleTakeMedication(localMed, {
        onSuccess: (takenTime, onTime) => {
          setLocalMed(prev => ({
            ...prev,
            status: "taken",
            takenTime: Timestamp.fromDate(takenTime),
            onTime: onTime
          }));
          fetchLastTakenReminder();
        },
        onError: (error) => {
          console.error("Error marking medication as taken:", error);
          Alert.alert("Error", "Failed to mark medication as taken. Please try again.");
        },
        openDateTimePicker
      });
    }
  };

  const formatScheduledTime = () => {
    const scheduledTime = getScheduledDate(localMed);
    const isToday = moment(scheduledTime).isSame(new Date(), 'day');
    const timeStr = moment(scheduledTime).format("HH:mm");
    return `Scheduled for ${timeStr}, ${isToday ? "today" : moment(scheduledTime).format("MMMM D")}`;
  };

  const formatTakenTime = () => {
    if (!localMed.takenTime || !(localMed.takenTime instanceof Timestamp)) return null;
    const takenTime = localMed.takenTime.toDate();
    return `Taken at ${moment(takenTime).format("HH:mm")}`;
  };

  const fetchLastTakenReminder = async () => {
    try {
      // Calculate the current reminder's scheduled datetime
      const scheduledTime = getScheduledDate(localMed);

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
        let closestReminder: { takenTime: Timestamp } | null = null;
        let minTimeDiff = Infinity;

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.takenTime || !(data.takenTime instanceof Timestamp)) return;
          
          const takenTime = data.takenTime.toDate();
          
          // Only consider reminders taken before the current scheduled time
          if (takenTime < scheduledTime) {
            const timeDiff = scheduledTime.getTime() - takenTime.getTime();
            if (timeDiff < minTimeDiff) {
              minTimeDiff = timeDiff;
              closestReminder = { takenTime: data.takenTime };
            }
          }
        });

        if (closestReminder?.takenTime) {
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
          onPress={handleMedicationAction}
          className="w-full"
          variant={localMed.status === "taken" ? "outline" : "default"}
        >
          <Text className={localMed.status === "taken" ? "text-foreground" : "text-white"}>
            {localMed.status === "taken" ? "Undo Medication" : "Take Medication"}
          </Text>
        </Button>
      </View>

      <DateTimePickerModal
        visible={dateTimePickerVisible}
        value={dateTimePickerValue}
        onChange={(date) => {
          setDateTimePickerVisible(false);
          if (date) {
            handleMedicationAction();
          }
        }}
        onRequestClose={() => setDateTimePickerVisible(false)}
      />
    </View>
  );
}