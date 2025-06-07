import React, { useState, useEffect } from "react";
import {
  View,
  Alert,
  SafeAreaView,
  Platform,
  ActionSheetIOS,
  Modal,
  Pressable,
  ActivityIndicator,
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
import DateTimePickerModal from "~/components/custom/DateTimePickerModal";
import type { Medication } from "~/src/types/medication";
import { getScheduledDate } from "~/src/utils/medicationActions";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";

// Typescript rules
type DayInput =
  | string
  | {
      dateString: string;
      day: number;
      month: number;
      year: number;
      timestamp: number;
    };

interface MedicationListProps {
  medications: Medication[];
  onMedicationUpdate: (medication: Medication) => void;
}

export default function MedicationList({ medications, onMedicationUpdate }: MedicationListProps) {
  const [items, setItems] = useState<{ [date: string]: any[] }>({});
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});
  const [selectedDate, setSelectedDate] = useState(
    moment().format("YYYY-MM-DD")
  );
  const [fetchedMonths, setFetchedMonths] = useState(new Set<string>());
  const [dateTimePickerVisible, setDateTimePickerVisible] = useState(false);
  const [dateTimePickerValue, setDateTimePickerValue] = useState<Date>(
    new Date()
  );
  const [dateTimePickerCallback, setDateTimePickerCallback] = useState<
    null | ((date: Date | null) => void)
  >(null);
  const [loading, setLoading] = React.useState<Boolean>(false);
  const { colors } = useTheme();
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);

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

  // Placeholder: Show reward UI
  const showReward = () => {
    // ...show reward UI...
  };

  // Helper: Open a modal date+time picker for both Android and iOS
  const openDateTimePicker = (medication: Medication, initialDate: Date): Promise<Date | null> => {
    return new Promise((resolve) => {
      setSelectedMedication(medication);
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

  const handleMedicationUpdate = async (medication: Medication) => {
    try {
      // Update the local state
      onMedicationUpdate(medication);
      
      // Refresh the current day's medications
      await fetchMedicationListForDay(selectedDate);
    } catch (error) {
      console.error("Error updating medication:", error);
      // Still try to refresh the list even if the callback fails
      await fetchMedicationListForDay(selectedDate);
    }
  };

  const calculateStatus = (medication: Medication) => {
    const now = new Date();
    const scheduledTime = getScheduledDate(medication);
    const isToday = moment(scheduledTime).isSame(now, 'day');
    const isPast = now > scheduledTime;
    
    if (medication.status === "taken") {
      return "TAKEN";
    } else if (isToday) {
      return "TAKE NOW";
    } else if (isPast) {
      return "PAST DOSE";
    } else {
      return "FUTURE DOSE";
    }
  };

  const formatScheduledTime = (medication: Medication) => {
    const scheduledTime = getScheduledDate(medication);
    return moment(scheduledTime).format("h:mm A");
  };

  const formatTakenTime = (medication: Medication) => {
    if (!medication.takenTime) return null;
    const takenTime = medication.takenTime.toDate();
    const scheduledTime = getScheduledDate(medication);
    const diffMinutes = Math.abs(takenTime.getTime() - scheduledTime.getTime()) / 60000;
    const isSameDay = takenTime.toDateString() === scheduledTime.toDateString();
    const withinOneHr = diffMinutes <= 60;
    const onTime = isSameDay && withinOneHr;

    return `Taken at ${moment(takenTime).format("h:mm A")} ${onTime ? "(on time)" : "(late)"}`;
  };

  /** 🔹 Called when the user selects a day */
  const handleDayPress = async (day: DayInput) => {
    setLoading(true);

    const dateString = typeof day === "string" ? day : day.dateString;
    setItems((prev) => ({ ...prev, [dateString]: [] }));
    setSelectedDate(dateString);

    try {
      await fetchMedicationListForDay(dateString); // Wait until this completes
    } finally {
      setLoading(false); // Always run this, even if fetch throws
    }
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
            <View key={item.reminderDocID} className="mx-10 my-5">
              {item.showTimeHeader && (
                <Text className="text-4xl font-semibold mb-4">
                  {item.reminderTime}
                </Text>
              )}
              <MedicationCard
                medication={item}
                onMedicationUpdate={handleMedicationUpdate}
                openDateTimePicker={(date) => openDateTimePicker(item, date)}
              />
            </View>
          )}
          renderDay={(day: any, item: any) => {
            return;
          }}
          renderEmptyDate={() => (
            <View style={{ margin: 10 }}>
              {loading ? (
                <ActivityIndicator size="small" />
              ) : (
              <Text>No medication reminders today.</Text>
              )}
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}
