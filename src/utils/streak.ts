import { router } from "expo-router";
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

/* ──────────────────────────────────────────────────────────────────────────
 * Types
 * ──────────────────────────────────────────────────────────────────────── */
interface ReminderData {
  date: Timestamp; // stored in Firestore
  status: "taken" | "skipped" | "pending";
}
interface UserStreakDoc {
  streak: number;
  uid: string;
}

/* Converter (optional strong‑typing) */
const streakConverter: FirestoreDataConverter<UserStreakDoc> = {
  toFirestore: (d) => d,
  fromFirestore: (snap) => snap.data() as UserStreakDoc,
};

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────── */
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};
const MS_IN_DAY = 86_400_000;

/* ──────────────────────────────────────────────────────────────────────────
 * Public API
 * ──────────────────────────────────────────────────────────────────────── */

/** Get streak (Firestore → cache) */
export const getStreakFromFirestore = async (uid: string): Promise<number> => {
  try {
    const snap = await getDoc(
      doc(db, "userStreaks", uid).withConverter(streakConverter)
    );
    if (snap.exists()) {
      const streak = snap.data().streak ?? 0;
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

/**
 * Main streak updater.
 *  - Increases streak if *all* meds for today are taken (on‑time **or** late)
 *  - Keeps streak if at least one med is taken/skipped
 *  - Resets streak if nothing is logged by midnight
 */
export const updateStreak = async (
  uid: string,
  isToday: boolean = true
): Promise<number> => {
  try {
    /* 1️⃣ Fetch current streak */
    const ref = doc(db, "userStreaks", uid);
    const snap = await getDoc(ref);
    const currentStreak = snap.exists()
      ? (snap.data() as UserStreakDoc).streak ?? 0
      : 0;
    let newStreak = currentStreak;

    /* 2️⃣ Fetch today’s reminders */
    const today = startOfToday();
    const tomorrow = new Date(today.getTime() + MS_IN_DAY);
    const q = query(
      collection(db, "reminders"),
      where("uid", "==", uid),
      where("date", ">=", Timestamp.fromDate(today)),
      where("date", "<", Timestamp.fromDate(tomorrow))
    );
    const docs = await getDocs(q);
    const reminders = docs.docs.map((d) => d.data() as ReminderData);

    const takenCount = reminders.filter((r) => r.status === "taken").length;
    const skippedCount = reminders.filter((r) => r.status === "skipped").length;
    const totalToday = reminders.length;

    /* 3️⃣ Apply new rules */
    if (totalToday > 0 && takenCount === totalToday) {
      /* ✅ all doses taken (on‑time OR late) */
      newStreak = currentStreak + 1;
    } else if (takenCount + skippedCount > 0) {
      /* ➖ at least one dose recorded */
      newStreak = currentStreak; // unchanged
    } else {
      /* ❌ nothing logged */
      newStreak = 0;
    }

    /* 4️⃣ Trigger DailyProgress after any dose is marked as taken */
    if (isToday && takenCount > 0) {
      router.replace({
        pathname: "/(app)/(tabs)/(home)/(progress)/DailyProgress",
        params: {
          taken: String(takenCount),
          total: String(totalToday),
        },
      });
    }

    /* 5️⃣ Persist streak */
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

/** Decrement streak by 1 (undo on‑time or late dose) */
export const decrementStreak = async (uid: string): Promise<number> => {
  try {
    const ref = doc(db, "userStreaks", uid);
    const snap = await getDoc(ref);
    const current = snap.exists()
      ? (snap.data() as UserStreakDoc).streak ?? 0
      : 0;
    const next = Math.max(0, current - 1);

    if (snap.exists()) {
      await updateDoc(ref, { streak: next, uid });
    } else {
      await setDoc(ref, { streak: next, uid });
    }
    await AsyncStorage.setItem(STREAK_KEY, String(next));
    return next;
  } catch (err) {
    console.error("Error decrementing streak:", err);
    return 0;
  }
};

/** Reset streak fully */
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
