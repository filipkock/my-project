import moment from "moment";
import { Timestamp } from "firebase/firestore";

// A helper function to generate dates
// using moment.js for date arithmetic
// --------------------------------------

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
