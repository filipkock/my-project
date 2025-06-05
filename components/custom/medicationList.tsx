import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  SafeAreaView,
  Platform,
  ActionSheetIOS,
} from "react-native";
import { Agenda } from "react-native-calendars";
import { getFromStorage } from "~/src/services/storage";
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
import { useTheme } from "@react-navigation/native";
import { Text } from "~/components/ui/text";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { Medication } from "~/types/medication";

export default function MedicationList() {
  const [items, setItems] = useState<{ [date: string]: any[] }>({});
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [fetchedMonths, setFetchedMonths] = useState(new Set<string>());
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [timePickerInitial, setTimePickerInitial] = useState<Date>(new Date());
  const [timePickerCallback, setTimePickerCallback] = useState<
    null | ((date: Date) => void)
  >(null);
  const { colors } = useTheme();

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
      const rawItems: Medication[] = [];

      remindersData.forEach((reminder) => {
        const medication = medicationsMap[reminder.medId] || {};
        rawItems.push({
          medDocID: reminder.medId,
          medicationName: medication.medicationName || "Unknown",
          medicationType: medication.medicationType || "Unknown",
          reminderTime: reminder.time,
          whenToTake: reminder.whenToTake,
          status: reminder.status,
          reminderDocID: reminder.reminderDocID,
          date: reminder.date,
          takenTime: reminder.takenTime,
          ...(reminder.takenTime && { takenTime: reminder.takenTime }),
          ...(reminder.onTime && { onTime: reminder.onTime }),
        });
      });

      // 🔹 Step 5: Group by reminderTime and add showTimeHeader
      const groupedByTime = rawItems.reduce(
        (acc: { [key: string]: any[] }, item) => {
          acc[item.reminderTime] = acc[item.reminderTime] || [];
          acc[item.reminderTime].push(item);
          return acc;
        },
        {} as { [key: string]: any[] }
      );

      const flattened: any[] = Object.entries(groupedByTime).flatMap(
        ([time, group]) =>
          group.map((item, index) => ({
            ...item,
            showTimeHeader: index === 0,
          }))
      );

      // 🔹 Step 6: Update state
      setItems({ [dayString]: flattened });
    } catch (error) {
      console.error("Error fetching medication for day:", error);
    }
  };

  // Helper: Mark medication as taken in Firestore
  const markMedicationAsTaken = async (
    reminderDocID: string,
    takenTime: Date,
    onTime: boolean
  ) => {
    const user = await getFromStorage("userDetails");
    if (!user?.email) return;
    try {
      const reminderRef = doc(db, `reminders`, reminderDocID);
      // Ensure takenTime is stored as Firestore Timestamp
      await updateDoc(reminderRef, {
        status: "taken",
        takenTime: Timestamp.fromDate(new Date(takenTime)),
        onTime: !!onTime, // ensure boolean
      });
      // Optionally update local state/UI here
    } catch (e) {
      console.error("Error updating medication status:", e);
    }
  };

  // Placeholder: Show reward UI
  const showReward = () => {
    // ...show reward UI...
  };

  // Helper: Open native time picker and return selected Date (time only)
  const openTimePicker = (initialDate: Date): Promise<Date | null> => {
    return new Promise((resolve) => {
      setTimePickerInitial(initialDate);
      setTimePickerCallback(() => (date: Date) => resolve(date));
      setTimePickerVisible(true);
    });
  };
  // -------------------------------------------------------------------
  // Tiny helpers for handleTakeMedication
  // -------------------------------------------------------------------
  /** Convert Firestore Timestamp → JS Date */
  const tsToDate = (ts: Timestamp | { seconds: number }): Date =>
    "toDate" in ts ? ts.toDate() : new Date(ts.seconds * 1000);

  /** Build (and memo-cache) the real scheduled date-time */
  const getScheduledDate = (med: Medication): Date | null => {
    // if we already computed once, reuse it
    if (med.scheduledTime) {
      return med.scheduledTime instanceof Date
        ? med.scheduledTime
        : new Date(med.scheduledTime.seconds * 1000);
    }

    const base = tsToDate(med.date); // → local date representing that calendar day
    const [h, m] = med.reminderTime.split(":").map(Number);

    if (isNaN(h) || isNaN(m)) return null; // bad format (should never happen now)

    base.setHours(h, m, 0, 0);
    med.scheduledTime = base; // cache for later use
    return base;
  };

  // -------------------------------------------------------------------
  // Main handler for handleTakeMedication
  // -------------------------------------------------------------------
  const handleTakeMedication = async (med: Medication) => {
    const now = new Date();
    const scheduled = getScheduledDate(med);

    if (!scheduled) {
      Alert.alert(
        "Error",
        "This medication reminder has an invalid time format."
      );
      return;
    }

    const diffMinutes = Math.abs(now.getTime() - scheduled.getTime()) / 60000;
    const isSameDay = scheduled.toDateString() === now.toDateString();
    const withinOneHr = diffMinutes <= 60;

    // -----------------------------------------------------------------
    // Helper that actually saves + updates local UI
    // -----------------------------------------------------------------
    const saveAndNotify = async (taken: Date, onTime: boolean) => {
      await markMedicationAsTaken(med.reminderDocID, taken, onTime);

      setItems((prev) => {
        const updated = { ...prev };
        for (const dateKey in updated) {
          updated[dateKey] = updated[dateKey].map((item) =>
            item.reminderDocID === med.reminderDocID
              ? { ...item, status: "taken", takenTime: taken, onTime: onTime }
              : item
          );
        }
        return updated;
      });

      if (onTime) showReward();
    };

    // -----------------------------------------------------------------
    // 1️⃣  Auto-mark ONLY if same calendar day  *and*  ≤ 60 min window
    // -----------------------------------------------------------------
    if (isSameDay && withinOneHr) {
      await saveAndNotify(now, true);
      return;
    }

    // -----------------------------------------------------------------
    // 2️⃣  Otherwise ask the user
    // -----------------------------------------------------------------
    const options = ["Cancel", "On Time", "Now", "Set Time"];
    const cancelButtonIndex = 0;

    const handleAction = async (index: number) => {
      if (index === 1) {
        // “On Time” → use scheduled date-time
        await saveAndNotify(scheduled, true);
      } else if (index === 2) {
        // “Now” → late/early
        await saveAndNotify(now, false);
      } else if (index === 3) {
        // “Set Time” → custom picker
        const picked = await openTimePicker(now);
        if (picked) {
          const pickedDate = new Date(
            scheduled.getFullYear(),
            scheduled.getMonth(),
            scheduled.getDate(),
            picked.getHours(),
            picked.getMinutes(),
            0,
            0
          );

          const onTime =
            Math.abs(pickedDate.getTime() - scheduled.getTime()) / 60000 <= 60;

          await saveAndNotify(pickedDate, onTime);
        }
      }
    };

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex },
        handleAction
      );
    } else {
      Alert.alert("Mark as Taken", "Choose when you took your medication:", [
        { text: "Cancel", style: "cancel" },
        { text: "On Time", onPress: () => handleAction(1) },
        { text: "Now", onPress: () => handleAction(2) },
        { text: "Set Time", onPress: () => handleAction(3) },
      ]);
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
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        {/* Time Picker Modal (iOS/Android) */}
        {timePickerVisible && (
          <DateTimePicker
            value={timePickerInitial}
            mode="time"
            is24Hour={true}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(event, date) => {
              setTimePickerVisible(false);
              if (date && timePickerCallback) timePickerCallback(date);
            }}
            // Only show time picker, not date
          />
        )}
        <Agenda
          theme={{
            calendarBackground: colors.background,
            agendaKnobColor: colors.primary,
            reservationsBackgroundColor: colors.background,
            dayTextColor: colors.primary,
            monthTextColor: colors.primary,
            dotColor: colors.primary,
            /* real PostScript names */
            textDayFontFamily: "Poppins-Regular",
            textDayHeaderFontFamily: "Poppins-Bold",
            textMonthFontFamily: "Poppins-Bold",
            agendaDayFontFamily: "Poppins-Regular",
            agendaDayHeaderFontFamily: "Poppins-Bold",
          }}
          items={items}
          markedDates={markedDates}
          selected={selectedDate}
          showOnlySelectedDayItems
          showClosingKnob
          onDayPress={handleDayPress}
          onMonthChange={handleMonthChange}
          renderItem={(item: any) => (
            <View className="mx-10 my-5">
              {item.showTimeHeader && (
                <Text className="text-4xl font-semibold mb-4">
                  {item.reminderTime}
                </Text>
              )}
              <MedicationCard
                medication={item}
                onTakeMedication={() => handleTakeMedication(item)}
              />
            </View>
          )}
          renderDay={(day: any, item: any) => {
            return;
          }}
          renderEmptyDate={() => (
            <View style={{ margin: 10 }}>
              <Text>No medication reminders today.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
