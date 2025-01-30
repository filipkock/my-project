import { View } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { getFromStorage } from "~/services/storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "~/config/firebase";
import MedicationCard from "./medicationCard";
import { Agenda } from "react-native-calendars";
import moment from "moment";

export default function medicationList() {
  const [medList, setMedList] = useState<{ [key: string]: Array<any> }>({});
  const today = moment().format("YYYY-MM-DD");

  useEffect(() => {
    GetMedicationList(today);
  }, []);

  const GetMedicationList = async (selectedDate: string) => {
    const user = await getFromStorage("userDetails");
    const formattedDate = moment(selectedDate, "YYYY-MM-DD").format(
      "MM/DD/YYYY"
    );
    try {
      // 1. Fetch documents for the user
      const medicationQuery = query(
        collection(db, "medication"),
        where("userEmail", "==", user?.email),
        where("reminderDates", "array-contains", formattedDate)
      );

      const querySnapshot = await getDocs(medicationQuery);

      // 2. Prepare an object that fits the Agenda items format
      const agendaItems: { [key: string]: Array<any> } = {};

      querySnapshot.forEach((doc) => {
        const data = doc.data();

        data.reminderDates.forEach((dateString: string) => {
          // Convert "MM/DD/YYYY" to "YYYY-MM-DD"
          const formattedDate = moment(dateString, "MM/DD/YYYY").format(
            "YYYY-MM-DD"
          );

          if (!agendaItems[formattedDate]) {
            agendaItems[formattedDate] = [];
          }

          // Push an item object for this medication on this date
          agendaItems[formattedDate].push({
            medicationName: data.medicationName,
            reminderTime: data.reminderTime,
            medicationType: data.medicationType,
            whenToTake: data.whenToTake,
            // ...any other fields you want to display
          });
        });
      });

      // 3. Set state hook called `medList` that your Agenda is using:
      setMedList(agendaItems);
    } catch (e) {
      console.error("Error fetching medication list:", e);
    }
  };

  return (
    <View className="flex-1 w-full">
      <Agenda
        //Stying and params
        showClosingKnob={true}
        showOnlySelectedDayItems={true}
        //Callback
        onDayPress={(day: any) => GetMedicationList(day.dateString)}
        onDayChange={(day: any) => GetMedicationList(day.dateString)}
        selected={moment().format("YYYY-MM-DD")}
        //Render
        items={medList}
        renderItem={(item: any, isFirstDay: boolean) => {
          return <MedicationCard medication={item} />;
        }}
      />
    </View>
  );
}
