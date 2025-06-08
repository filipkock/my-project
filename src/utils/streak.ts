import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  FirestoreDataConverter,
} from "firebase/firestore";
import { db } from "~/config/firebase";

const STREAK_KEY = "@medication_streak";

/** ──────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────── */
interface ReminderData {
  date: Timestamp; // stored in Firestore
  onTime: boolean;
}

interface UserStreakDoc {
  streak: number;
  uid: string;
}

/** Optional: strong-type the collection
 -------------------------------------------------------- */
const streakConverter: FirestoreDataConverter<UserStreakDoc> = {
  toFirestore: (data) => data,
  fromFirestore: (snap) => snap.data() as UserStreakDoc,
};

/** ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────── */
const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const MS_IN_DAY = 86_400_000;

/** ──────────────────────────────────────────────────────────────────────────
 * Public API
 * ──────────────────────────────────────────────────────────────────────── */

/** Fetch the current streak (Firestore → cache). */
export const getStreakFromFirestore = async (uid: string): Promise<number> => {
  try {
    const docSnap = await getDoc(
      doc(db, "userStreaks", uid).withConverter(streakConverter)
    );

    if (docSnap.exists()) {
      const streak = docSnap.data().streak ?? 0;
      await AsyncStorage.setItem(STREAK_KEY, String(streak));
      return streak;
    }
    return 0;
  } catch (err) {
    console.error("Error getting streak from Firestore:", err);
    const cached = await AsyncStorage.getItem(STREAK_KEY);
    return cached ? Number(cached) : 0;
  }
};

/** Increment or reset the streak after a dose event. */
export const updateStreak = async (
  uid: string,
  onTime: boolean
): Promise<number> => {
  try {
    const ref = doc(db, "userStreaks", uid);
    const snap = await getDoc(ref);

    // Get current streak value
    const currentStreak = snap.exists()
      ? (snap.data() as UserStreakDoc).streak ?? 0
      : 0;
    let newStreak = currentStreak;

    const today = getToday();
    const tomorrow = new Date(today.getTime() + MS_IN_DAY);
    const q = query(
      collection(db, "reminders"),
      where("uid", "==", uid),
      where("date", ">=", Timestamp.fromDate(today)),
      where("date", "<", Timestamp.fromDate(tomorrow))
    );
    const docs = await getDocs(q);
    const reminders = docs.docs.map((d) => d.data() as ReminderData);
    const allTaken = reminders.every((r) => r.onTime === true);

    if (onTime && allTaken) {
      newStreak = currentStreak + 1;
    } else if (!onTime) {
      newStreak = 0;
    }

    // Write back (always include uid so generic rule passes)
    if (snap.exists()) {
      await updateDoc(ref, { streak: newStreak, uid });
    } else {
      await setDoc(ref, { streak: newStreak, uid });
    }

    await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
    return newStreak;
  } catch (err) {
    console.error("Error updating streak:", err);
    return 0;
  }
};

/** Decrement the streak by 1 when undoing an on-time medication. */
export const decrementStreak = async (uid: string): Promise<number> => {
  try {
    const ref = doc(db, "userStreaks", uid);
    const snap = await getDoc(ref);

    // Get current streak value
    const currentStreak = snap.exists()
      ? (snap.data() as UserStreakDoc).streak ?? 0
      : 0;
    const newStreak = Math.max(0, currentStreak - 1); // Ensure streak doesn't go below 0

    // Write back (always include uid so generic rule passes)
    if (snap.exists()) {
      await updateDoc(ref, { streak: newStreak, uid });
    } else {
      await setDoc(ref, { streak: newStreak, uid });
    }

    await AsyncStorage.setItem(STREAK_KEY, String(newStreak));
    return newStreak;
  } catch (err) {
    console.error("Error decrementing streak:", err);
    return 0;
  }
};

/** Force-reset the user's streak. */
export const resetStreak = async (uid: string): Promise<void> => {
  try {
    await setDoc(
      doc(db, "userStreaks", uid),
      { streak: 0, uid },
      { merge: true }
    );
    await AsyncStorage.setItem(STREAK_KEY, "0");
  } catch (err) {
    console.error("Error resetting streak:", err);
  }
};

/** Recalculate the streak from the reminders collection (repair tool). */
export const recalculateStreakFromFirestore = async (
  uid: string
): Promise<number> => {
  try {
    // newest → oldest taken reminders for this user
    const q = query(
      collection(db, "reminders"),
      where("uid", "==", uid),
      where("status", "==", "taken"),
      orderBy("date", "desc")
    );
    const snapshot = await getDocs(q);

    const reminders = snapshot.docs.map((d) => d.data() as ReminderData);

    if (reminders.length === 0) {
      await resetStreak(uid);
      return 0;
    }

    let streak = 0;
    let cursor = getToday();

    for (const { date, onTime } of reminders) {
      const reminderDate = date.toDate();
      reminderDate.setHours(0, 0, 0, 0);

      const diff = cursor.getTime() - reminderDate.getTime();

      if (diff === 0 || diff === MS_IN_DAY) {
        if (onTime) {
          streak += 1;
          cursor = reminderDate; // step back one day
        } else {
          break; // missed dose
        }
      } else {
        break; // gap in days
      }
    }

    await setDoc(doc(db, "userStreaks", uid), { streak, uid }, { merge: true });
    await AsyncStorage.setItem(STREAK_KEY, String(streak));

    return streak;
  } catch (err) {
    console.error("Error recalculating streak:", err);
    return 0;
  }
};
