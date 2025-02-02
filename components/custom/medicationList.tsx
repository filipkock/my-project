import React, { useState, useEffect } from "react";
import { View, Text, Alert } from "react-native";
import { Agenda } from "react-native-calendars";
import { getFromStorage } from "~/services/storage";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import moment from "moment";
import { db } from "~/config/firebase";
import MedicationCard from "~/components/custom/medicationCard";

export default function MedicationList() {
  const [items, setItems] = useState<{ [date: string]: any[] }>({});
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [fetchedMonths, setFetchedMonths] = useState(new Set<string>());

  useEffect(() => {
    const loadInitialData = async () => {
      const currentMoment = moment();
      await fetchReminderDotsForMonth(currentMoment);
      await fetchMedicationListForDay(currentMoment.format("YYYY-MM-DD"));
    };
    loadInitialData();
  }, []);

  /** 🔹 Fetch reminders for a specific month (lazy-load) */
  const fetchReminderDotsForMonth = async (monthMoment: moment.Moment) => {
    const monthKey = monthMoment.format("YYYY-MM");
    if (fetchedMonths.has(monthKey)) return;

    try {
      const startOfMonth = Timestamp.fromDate(
        monthMoment.clone().startOf("month").toDate()
      );
      const endOfMonth = Timestamp.fromDate(
        monthMoment.clone().endOf("month").toDate()
      );

      const newMarkedDates: { [date: string]: any } = {};
      const userinfo = await getFromStorage("userDetails");
      if (!userinfo) return;

      const remindersQuery = query(
        collection(db, "reminders"),
        where("date", ">=", startOfMonth),
        where("date", "<=", endOfMonth),
        where("uid", "==", userinfo.uid)
      );

      const remindersSnapshot = await getDocs(remindersQuery);

      remindersSnapshot.forEach((doc) => {
        const dateString = moment(doc.data().date.toDate()).format(
          "YYYY-MM-DD"
        );
        newMarkedDates[dateString] = {
          marked: true,
          dots: [{ key: "reminder", color: "blue" }],
        };
      });

      setMarkedDates((prev) => ({ ...prev, ...newMarkedDates }));
      setFetchedMonths((prev) => new Set(prev).add(monthKey));
    } catch (error) {
      console.error("Error fetching reminder dots:", error);
    }
  };

  /** 🔹 Fetch medication reminders for a selected day */
  const fetchMedicationListForDay = async (dayString: string) => {
    try {
      const selectedDayTimestamp = Timestamp.fromDate(
        moment(dayString, "YYYY-MM-DD").toDate()
      );

      const userinfo = await getFromStorage("userDetails");
      if (!userinfo) return;

      // 🔹 Step 1: Fetch reminders for today
      const remindersQuery = query(
        collection(db, "reminders"),
        where("date", "==", selectedDayTimestamp),
        where("uid", "==", userinfo.uid)
      );
      const remindersSnapshot = await getDocs(remindersQuery);

      if (remindersSnapshot.empty) {
        setItems({ [dayString]: [] });
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

      // 🔹 Step 2: Fetch each medication document in parallel
      const medicationFetchPromises = Array.from(medIdSet).map(
        async (medId) => {
          const medDocRef = doc(db, "medication", medId);
          const medDocSnapshot = await getDoc(medDocRef);
          return medDocSnapshot.exists()
            ? { medId, ...medDocSnapshot.data() }
            : null;
        }
      );

      const medicationsArray = await Promise.all(medicationFetchPromises);

      // 🔹 Step 3: Convert medicationsArray to a map for quick lookup
      const medicationsMap: { [key: string]: any } = {};
      medicationsArray.forEach((med) => {
        if (med) {
          medicationsMap[med.medId] = med;
        }
      });

      // 🔹 Step 4: Merge reminders with corresponding medication details
      const newItems: { [date: string]: any[] } = { [dayString]: [] };

      remindersData.forEach((reminder) => {
        const medication = medicationsMap[reminder.medId] || {};
        newItems[dayString].push({
          medDocID: reminder.medId,
          medicationName: medication.medicationName || "Unknown",
          medicationType: medication.medicationType || "Unknown",
          reminderTime: reminder.time,
          whenToTake: reminder.whenToTake,
          status: reminder.status,
          reminderDocID: reminder.reminderDocID,
        });
      });

      // 🔹 Step 5: Update state
      setItems(newItems);
    } catch (error) {
      console.error("Error fetching medication for day:", error);
    }
  };

  // Called when user marks medication as taken
  const handleTakeMedication = async (reminderDocID: string) => {
    const user = await getFromStorage("userDetails");
    if (!user?.email) return;

    try {
      const reminderRef = doc(db, `reminders`, reminderDocID);
      // TODO: Add centralised place for medication status.
      await updateDoc(reminderRef, { status: "taken" });
      Alert.alert("Success!", "You have taken your medication.");
    } catch (e) {
      console.error("Error updating medication status:", e);
    }
  };

  /** 🔹 Called when the user selects a day */
  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    fetchMedicationListForDay(day.dateString);
  };

  /** 🔹 Called when the user switches months */
  const handleMonthChange = (monthData: any) => {
    const formattedMonth = String(monthData.month).padStart(2, "0");
    const newMonthMoment = moment(
      `${monthData.year}-${formattedMonth}-01`,
      "YYYY-MM-DD",
      true
    );
    fetchReminderDotsForMonth(newMonthMoment);
  };

  return (
    <View style={{ flex: 1 }}>
      <Agenda
        items={items}
        markedDates={markedDates}
        selected={selectedDate}
        showOnlySelectedDayItems
        showClosingKnob
        onDayPress={handleDayPress}
        onMonthChange={handleMonthChange}
        renderItem={(item: any) => (
          <MedicationCard
            medication={item}
            onTakeMedication={(reminderDocID) =>
              handleTakeMedication(reminderDocID)
            }
          />
        )}
        renderEmptyDate={() => (
          <View style={{ margin: 10 }}>
            <Text>No medication reminders today.</Text>
          </View>
        )}
      />
    </View>
  );
}
