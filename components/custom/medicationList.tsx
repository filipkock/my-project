import React, { useState, useEffect, useCallback } from "react";
import { View, SafeAreaView } from "react-native";
import { getFromStorage } from "~/src/services/storage";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import moment from "moment";
import { db } from "~/config/firebase";
import type { Medication } from "~/src/types/medication";
import { getScheduledDate } from "~/src/utils/medicationActions";
import CalendarStrip from "./CalendarStrip";
import MedicationListForDay from "./MedicationListForDay";
import DateTimePickerModal from "./DateTimePickerModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

interface MedicationListProps {
  medications: Medication[];
  onMedicationUpdate: (medication: Medication) => void;
}

export default function MedicationList({ medications, onMedicationUpdate }: MedicationListProps) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [items, setItems] = useState<Medication[]>([]);
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [fetchedMonths, setFetchedMonths] = useState(new Set<string>());
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [dateTimePickerValue, setDateTimePickerValue] = useState<Date>(new Date());
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const refreshData = async () => {
        await fetchMedicationListForDay(selectedDate);
      };
      refreshData();
    }, [selectedDate])
  );

  // Listen for medication updates from the details page
  useEffect(() => {
    const handleMedicationUpdate = (medication: Medication) => {
      setItems(prev => prev.map(item => 
        item.reminderDocID === medication.reminderDocID
          ? { ...item, ...medication }
          : { ...item }
      ));
    };

    // Check for medication updates in params
    if (params.medication) {
      const updatedMedication = JSON.parse(params.medication as string);
      handleMedicationUpdate(updatedMedication);
    }
  }, [params.medication]);

  // const fetchReminderDotsForMonth = async (monthMoment: moment.Moment) => {
  //   const monthKey = monthMoment.format("YYYY-MM");
  //   if (fetchedMonths.has(monthKey)) return;

  //   try {
  //     const startOfMonth = Timestamp.fromDate(
  //       monthMoment.clone().startOf("month").toDate()
  //     );
  //     const endOfMonth = Timestamp.fromDate(
  //       monthMoment.clone().endOf("month").toDate()
  //     );

  //     const newMarkedDates: { [date: string]: any } = {};
  //     const userinfo = await getFromStorage("userDetails");
  //     if (!userinfo) return;

  //     const remindersQuery = query(
  //       collection(db, "reminders"),
  //       where("date", ">=", startOfMonth),
  //       where("date", "<=", endOfMonth),
  //       where("uid", "==", userinfo.uid)
  //     );

  //     const remindersSnapshot = await getDocs(remindersQuery);

  //     remindersSnapshot.forEach((doc) => {
  //       const dateString = moment(doc.data().date.toDate()).format("YYYY-MM-DD");
  //       newMarkedDates[dateString] = {
  //         marked: true,
  //         dots: [{ key: "reminder", color: "blue" }],
  //       };
  //     });

  //     setMarkedDates((prev) => ({ ...prev, ...newMarkedDates }));
  //     setFetchedMonths((prev) => new Set(prev).add(monthKey));
  //   } catch (error) {
  //     console.error("Error fetching reminder dots:", error);
  //   }
  // };

  const fetchMedicationListForDay = async (dayString: string) => {
    try {
      setLoading(true);
      const selectedDayTimestamp = Timestamp.fromDate(
        moment(dayString, "YYYY-MM-DD").toDate()
      );

      const userinfo = await getFromStorage("userDetails");
      if (!userinfo) {
        setItems([]);
        return;
      }

      const remindersQuery = query(
        collection(db, "reminders"),
        where("date", "==", selectedDayTimestamp),
        where("uid", "==", userinfo.uid)
      );
      const remindersSnapshot = await getDocs(remindersQuery);

      if (remindersSnapshot.empty) {
        setItems([]);
        return;
      }

      const remindersData: any[] = [];
      const medIdSet = new Set<string>();

      remindersSnapshot.forEach((doc) => {
        const reminder = doc.data();
        remindersData.push({ ...reminder, reminderDocID: doc.id });
        medIdSet.add(reminder.medId);
      });

      if (medIdSet.size === 0) return;

      const medicationFetchPromises = Array.from(medIdSet).map(async (medId) => {
        const medDocRef = doc(db, "medication", medId);
        const medDocSnapshot = await getDoc(medDocRef);
        return medDocSnapshot.exists() ? { medId, ...medDocSnapshot.data() } : null;
      });

      const medicationsArray = await Promise.all(medicationFetchPromises);
      const medicationsMap: { [key: string]: any } = {};
      medicationsArray.forEach((med) => {
        if (med) {
          medicationsMap[med.medId] = med;
        }
      });

      const rawItems: Medication[] = remindersData.map((reminder) => {
        const medication = medicationsMap[reminder.medId] || {};
        return {
          medDocID: reminder.medId,
          medicationName: medication.medicationName || "Unknown",
          medicationType: medication.medicationType || "Unknown",
          reminderTime: reminder.time,
          whenToTake: reminder.whenToTake,
          status: reminder.status,
          reminderDocID: reminder.reminderDocID,
          date: reminder.date,
          ...(reminder.takenTime && { takenTime: reminder.takenTime }),
          ...(reminder.onTime && { onTime: reminder.onTime }),
        };
      });

      // Sort items by reminder time
      const sortedItems = rawItems.sort((a, b) => {
        // Ensure times are in HH:mm format
        const timeA = a.reminderTime.padStart(5, '0');
        const timeB = b.reminderTime.padStart(5, '0');
        return timeA.localeCompare(timeB);
      });

      setItems(sortedItems);
    } catch (error) {
      console.error("Error fetching medication for day:", error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDayPress = async (dateString: string) => {
    setSelectedDate(dateString);
    await fetchMedicationListForDay(dateString);
  };

  const openDateTimePicker = (medication: Medication, initialDate: Date): Promise<Date | null> => {
    return new Promise((resolve) => {
      setSelectedMedication(medication);
      setDateTimePickerValue(initialDate);
      setDateTimePickerVisible(true);
      const handleChange = (date: Date | null) => {
        setDateTimePickerVisible(false);
        resolve(date);
      };
    });
  };

  const handleMedicationUpdate = async (medication: Medication) => {
    try {
      // First update the parent component's state
      onMedicationUpdate(medication);
      
      // Update local state with deep cloning
      setItems(prev => prev.map(item => 
        item.reminderDocID === medication.reminderDocID
          ? { ...item, ...medication }
          : { ...item }
      ));

      // Refresh from server
      await fetchMedicationListForDay(selectedDate);
    } catch (error) {
      console.error("Error updating medication:", error);
      await fetchMedicationListForDay(selectedDate);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <DateTimePickerModal
          visible={dateTimePickerVisible}
          value={dateTimePickerValue}
          onChange={(date) => {
            setDateTimePickerVisible(false);
            if (date && selectedMedication) {
              handleMedicationUpdate(selectedMedication);
            }
          }}
          onRequestClose={() => setDateTimePickerVisible(false)}
        />
        <CalendarStrip
          selectedDate={selectedDate}
          onSelectDate={handleDayPress}
          markedDates={markedDates}
        />
        <MedicationListForDay
          items={items}
          loading={loading}
          onMedicationUpdate={handleMedicationUpdate}
          openDateTimePicker={openDateTimePicker}
        />
      </View>
    </SafeAreaView>
  );
}
