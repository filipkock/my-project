// Centralized TypeScript type for Medication

import { Timestamp } from "firebase/firestore";

// More used for medicaation reminders in the calendar
export interface Medication {
  medDocID: string;
  medicationName: string;
  medicationType: string;
  reminderTime: string;
  whenToTake: string;
  status: string;
  reminderDocID: string;
  date: Timestamp;
  scheduledTime?: Date;
  takenTime?: Timestamp | null;
  onTime?: boolean | null;
  dosageAmount?: number;
  dosageUnit?: string;
  dosageStrength?: string;
}

// Centralized TypeScript type for Medication Form Data when editing or creating new medications
export interface FormData {
  medicationName: string | undefined;
  medicationType: string | undefined;
  whenToTake: string | undefined;
  intakeInterval: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  reminderTime: string | undefined;
  customIntervalValue?: string; // numeric string for "X"
  specificDaysOfWeek: number[]; // used for "Specific days weekly"
  reminderDates?: Date[];
}
