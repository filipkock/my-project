// utils/streakResetOnLaunch.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import moment from "moment";
import { db } from "~/config/firebase";
import { getFromStorage } from "~/src/services/storage";
import { resetStreak } from "~/src/utils/streak";

/** Key used in AsyncStorage */
const LAST_CHECK_KEY = "lastStreakCheck";

/**
 * Loop over every day between the last-checked date (exclusive)
 * and yesterday (inclusive). If we find a day where the user
 * logged zero “taken” or “skipped” reminders, reset the streak.
 *
 *  – Stores the last-checked date both locally (AsyncStorage)
 *    and in Firestore (`userStreakMeta.lastStreakCheck`).
 */
export const checkAndResetStreakIfNeeded = async (): Promise<void> => {
  try {
    /* 1. Basic date strings in local timezone */
    const todayStr = moment().format("YYYY-MM-DD");
    const yesterdayStr = moment().subtract(1, "day").format("YYYY-MM-DD");

    /* 2. Get cached last-checked date (default = yesterday) */
    let lastChecked =
      (await AsyncStorage.getItem(LAST_CHECK_KEY)) ?? yesterdayStr;

    // Early return if already checked today
    if (lastChecked === todayStr) {
      console.log("Already checked today, skipping.");
      return;
    }

    /* 3. Merge with Firestore meta */
    const userinfo = await getFromStorage("userDetails");
    if (!userinfo) return;
    const uid = userinfo.uid;

    const streakRef = doc(db, "userStreaks", uid);
    const streakSnap = await getDoc(streakRef);
    const streakData = streakSnap.exists() ? streakSnap.data() : null;
    const currentStreak = streakData?.streak ?? 0;

    if (currentStreak === 0) {
      console.log("Streak is already 0. Skipping check.");
      return;
    }

    const metaRef = doc(db, "userStreakMeta", uid);
    const metaSnap = await getDoc(metaRef);
    if (metaSnap.exists()) {
      const metaDate = metaSnap.data().lastStreakCheck as string | undefined;
      if (metaDate && moment(metaDate).isAfter(lastChecked)) {
        lastChecked = metaDate;
      }
    }

    /* ------------------------------------------------------------ *
     * Always re-evaluate YESTERDAY first — even if lastChecked ≥ yesterday
     * ------------------------------------------------------------ */
    const evaluateDay = async (dayISO: string): Promise<boolean> => {
      const ts = Timestamp.fromDate(new Date(`${dayISO}T00:00:00`));
      const qRem = query(
        collection(db, "reminders"),
        where("uid", "==", uid),
        where("date", "==", ts)
      );
      const snap = await getDocs(qRem);
      const reminders = snap.docs.map((d) => d.data());
      if (reminders.length === 0) return false; // No reminders → ignore

      const anyLogged = reminders.some(
        (r) => r.status === "taken" || r.status === "skipped"
      );
      return !anyLogged; // true = streak should reset
    };

    /* 3a. Check yesterday */
    const missedYesterday = await evaluateDay(yesterdayStr);

    /* 3b. If yesterday missed → reset and stop */
    if (missedYesterday) {
      await resetStreak(uid);
      await AsyncStorage.setItem(LAST_CHECK_KEY, todayStr);
      await setDoc(metaRef, { lastStreakCheck: todayStr }, { merge: true });
      console.log("Streak reset because nothing was logged yesterday.");
      router.replace("/(app)/homePages/progress/StreakResetNotice");
      return;
    }

    /* 4. If lastChecked already up-to-date, finish */
    if (moment(lastChecked).isSameOrAfter(yesterdayStr)) {
      await AsyncStorage.setItem(LAST_CHECK_KEY, todayStr);
      await setDoc(metaRef, { lastStreakCheck: todayStr }, { merge: true });
      return;
    }

    /* 5. Otherwise scan older un-checked days until yesterday */
    let cursor = moment(lastChecked).add(1, "day"); // next day after lastChecked
    const end = moment(yesterdayStr);

    while (cursor.isSameOrBefore(end)) {
      if (await evaluateDay(cursor.format("YYYY-MM-DD"))) {
        await resetStreak(uid);
        console.log(
          `Streak reset due to missed day ${cursor.format("YYYY-MM-DD")}`
        );
        router.replace("/(app)/homePages/progress/StreakResetNotice");
        break;
      }
      cursor = cursor.add(1, "day");
    }

    /* 6. Persist new last-check date */
    await AsyncStorage.setItem(LAST_CHECK_KEY, todayStr);
    await setDoc(metaRef, { lastStreakCheck: todayStr }, { merge: true });
  } catch (err) {
    console.error("Streak check failed:", err);
  }
};
