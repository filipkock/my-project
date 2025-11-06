import moment from "moment";
import { Timestamp } from "firebase/firestore";

// Aligns the scheduling start date so that "every X days/weeks/months" continues
// from the medication's original start date, preserving the correct cadence.
export function alignStartToPhase(
  anchorStart: Date | null | undefined,
  windowStart: Date,
  intakeInterval: string,
  customIntervalValue?: number
): Date {
  const startOf = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const MS = 24 * 60 * 60 * 1000;

  const anchor = anchorStart ? startOf(anchorStart) : null;
  let aligned = startOf(windowStart);
  // Ensure custom interval is a positive number; fallback to daily if invalid
  let k = Number(customIntervalValue);
  if (!Number.isFinite(k) || k <= 0) k = 1;

  // Convert textual interval forms into the consistent 'every X days' form
  // Normalize "Every other day" into "every X days"
  if (intakeInterval === "Every other day") {
    intakeInterval = "every X days";
    k = 2;
  }

  // Convert "every X weeks" → days
  if (intakeInterval === "every X weeks") {
    intakeInterval = "every X days";
    k = k * 7;
  }

  // Handle "every X months": advance by whole months from the anchor until we reach the windowStart
  // This keeps the original day-of-month cadence (e.g., 15th stays 15th), and only moves forward.
  if (intakeInterval === "every X months" && anchor) {
    const step = Math.max(1, k); // ensure at least 1 month
    let cur = moment(anchor).startOf("day");
    const target = moment(startOf(windowStart));
    while (cur.isBefore(target, "day")) {
      cur.add(step, "months");
    }
    aligned = cur.toDate();
  }

  // Only X-based intervals have phase alignment
  if (intakeInterval === "every X days" && anchor) {
    // Shift the windowStart forward so that (date - anchorStart) % X === 0
    // This preserves the original 'every X days' rhythm without back-generating old dates
    const daysBetween = Math.floor((aligned.getTime() - anchor.getTime()) / MS);
    const remainder = ((daysBetween % k) + k) % k;
    if (remainder !== 0) {
      aligned = new Date(
        aligned.getFullYear(),
        aligned.getMonth(),
        aligned.getDate() + (k - remainder)
      );
    }
  }

  return aligned;
}

/**
 * Generates an array of Dates when the user
 * should be reminded about a medication.
 *
 * @param {Date} startDate
 * @param {Date} endDate
 * @param {string} intakeInterval
 * @param {{ customIntervalValue?: number; specificDaysOfWeek?: number[] }} options
 * @returns {Timestamp[]} - List of all reminder dates.
 */
export function generateReminderDates(
  startDate: Date,
  endDate: Date,
  intakeInterval: string,
  {
    customIntervalValue,
    specificDaysOfWeek,
  }: {
    customIntervalValue?: number;
    specificDaysOfWeek?: number[];
  }
): Timestamp[] {
  const dates: Timestamp[] = [];

  const start = moment(startDate).startOf("day");
  const end = moment(endDate).endOf("day"); // ensure we include the end day if it matches

  let localInterval = intakeInterval;
  let localCustomValue = customIntervalValue;

  // Convert "every X weeks" to "every X days" by multiplying the custom value by 7
  if (localInterval === "every X weeks") {
    localInterval = "every X days";
    if (localCustomValue) {
      localCustomValue = localCustomValue * 7;
    }
  }

  const current = moment(start);

  while (current.isSameOrBefore(end, "day")) {
    switch (localInterval) {
      case "Every day": {
        dates.push(Timestamp.fromDate(current.toDate()));
        current.add(1, "day");
        break;
      }
      case "Every other day": {
        dates.push(Timestamp.fromDate(current.toDate()));
        current.add(2, "days");
        break;
      }
      case "Specific days weekly": {
        // if user picked day-of-week (0=Sun, 1=Mon, etc.)
        if (specificDaysOfWeek?.includes(current.day())) {
          dates.push(Timestamp.fromDate(current.toDate()));
        }
        current.add(1, "day");
        break;
      }
      case "every X days": {
        dates.push(Timestamp.fromDate(current.toDate()));
        const increment =
          localCustomValue && localCustomValue > 0 ? localCustomValue : 1;
        current.add(increment, "days");
        break;
      }
      case "every X months": {
        dates.push(Timestamp.fromDate(current.toDate()));
        const increment =
          localCustomValue && localCustomValue > 0 ? localCustomValue : 1;
        current.add(increment, "months");
        break;
      }
      case "on a recurring cycle": {
        dates.push(Timestamp.fromDate(current.toDate()));
        // Minimal example to avoid infinite loop
        current.add(1, "day");
        break;
      }
      default:
        // Fallback: treat like "Every day"
        dates.push(Timestamp.fromDate(current.toDate()));
        current.add(1, "day");
        break;
    }
  }

  return dates;
}

/**
 * Extracts and formats the time from a Date object.
 * @param {Date} date - The selected Date object.
 * @returns {string} - Formatted time string (e.g., "14:30").
 */
export const formatTime = (date: Date): string => {
  return moment(date).format("HH:mm"); // 24-hour format (use "hh:mm A" for 12-hour)
};

/**
 * Converts a time string (e.g., "14:30") to a Date object.
 * @param {string} timeString - The time string to convert.
 * @returns {Date} - A Date object representing the time.
 */
export const timeStringToDate = (timeString: string): Date => {
  return moment(timeString, "HH:mm").toDate();
};

/**
 * Computes both the rolling window end (now + afterDays, end-of-day)
 * and the effective end (min(userEnd, windowEnd)).
 */
export function computeEndWindow(
  userEnd: Date | undefined | null,
  now: Date = new Date(),
  afterDays: number = 14
): { effectiveEnd: Date; windowEnd: Date } {
  const windowEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + afterDays,
    23,
    59,
    59,
    999
  );
  const effectiveEnd =
    userEnd && userEnd.getTime() <= windowEnd.getTime() ? userEnd : windowEnd;
  return { effectiveEnd, windowEnd };
}

/**
 * Clamps a user-selected end date to a chunk window that ends `afterDays` days from `now`.
 * Returns the effectiveEnd to use for generation/queries.
 */
export function clampEndToWindow(
  userEnd: Date | undefined | null,
  now: Date = new Date(),
  afterDays: number = 14
): Date {
  return computeEndWindow(userEnd, now, afterDays).effectiveEnd;
}
