// Centralized TypeScript type for Medication

import { Timestamp } from "firebase/firestore";

export interface Medication {
  medDocID: string;
  medicationName: string;
  medicationType: string;
  reminderTime: string;
  whenToTake: string;
  status: string;
  reminderDocID: string;
  date: Timestamp;
  scheduledTime?: Date | { seconds: number };
  takenTime?: any;
  onTime?: boolean;
}
