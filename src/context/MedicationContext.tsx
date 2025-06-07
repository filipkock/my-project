import React, { createContext, useContext, useState, useCallback } from "react";
import type { Medication } from "~/src/types/medication";
import { collection, query, where, getDocs, Timestamp, doc, getDoc } from "firebase/firestore";
import { db } from "~/config/firebase";
import { getFromStorage } from "~/src/services/storage";
import moment from "moment";

interface MedicationContextType {
  medications: Medication[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  updateMedication: (medication: Medication) => void;
  refreshMedicationsForDate: (date: string) => Promise<void>;
  loading: boolean;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));
  const [loading, setLoading] = useState(false);

  const updateMedication = useCallback((medication: Medication) => {
    setMedications(prevMedications => {
      // Create a new array with the updated medication
      const updatedMedications = prevMedications.map(med => 
        med.medDocID === medication.medDocID ? { ...medication } : med
      );
      return updatedMedications;
    });
  }, []);

  const refreshMedicationsForDate = useCallback(async (date: string) => {
    try {
      setLoading(true);
      const selectedDayTimestamp = Timestamp.fromDate(
        moment(date, "YYYY-MM-DD").toDate()
      );

      const userinfo = await getFromStorage("userDetails");
      if (!userinfo) return;

      const remindersQuery = query(
        collection(db, "reminders"),
        where("date", "==", selectedDayTimestamp),
        where("uid", "==", userinfo.uid)
      );
      const remindersSnapshot = await getDocs(remindersQuery);

      if (remindersSnapshot.empty) {
        setMedications([]);
        return;
      }

      const remindersData: any[] = [];
      const medIdSet = new Set<string>();

      remindersSnapshot.forEach((doc) => {
        const reminder = doc.data();
        remindersData.push({ ...reminder, reminderDocID: doc.id });
        medIdSet.add(reminder.medId);
      });

      const medicationsArray = await Promise.all(
        Array.from(medIdSet).map(async (medId) => {
          const medDocRef = doc(db, "medication", medId);
          const medDocSnapshot = await getDoc(medDocRef);
          return medDocSnapshot.exists()
            ? { medId, ...medDocSnapshot.data() }
            : null;
        })
      );

      const medicationsMap: { [key: string]: any } = {};
      medicationsArray.forEach((med) => {
        if (med) {
          medicationsMap[med.medId] = med;
        }
      });

      const updatedMedications = remindersData.map((reminder) => {
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

      setMedications(updatedMedications);
    } catch (error) {
      console.error("Error refreshing medications for date:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MedicationContext.Provider
      value={{
        medications,
        selectedDate,
        setSelectedDate,
        updateMedication,
        refreshMedicationsForDate,
        loading
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

export function useMedication() {
  const context = useContext(MedicationContext);
  if (context === undefined) {
    throw new Error("useMedication must be used within a MedicationProvider");
  }
  return context;
} 