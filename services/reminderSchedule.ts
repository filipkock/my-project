import moment from "moment";

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
 * @returns {string[]} - List of all reminder dates.
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
): string[] {
  const dates: string[] = [];

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
        dates.push(moment(current).format("MM/DD/YYYY"));
        current.add(1, "day");
        break;
      }
      case "Every other day": {
        dates.push(moment(current).format("MM/DD/YYYY"));
        current.add(2, "days");
        break;
      }
      case "Specific days weekly": {
        // if user picked day-of-week (0=Sun, 1=Mon, etc.)
        if (specificDaysOfWeek?.includes(current.day())) {
          dates.push(moment(current).format("MM/DD/YYYY"));
        }
        current.add(1, "day");
        break;
      }
      case "every X days": {
        dates.push(moment(current).format("MM/DD/YYYY"));
        const increment = localCustomValue && localCustomValue > 0 ? localCustomValue : 1;
        current.add(increment, "days");
        break;
      }
      case "every X months": {
        dates.push(moment(current).format("MM/DD/YYYY"));
        const increment = localCustomValue && localCustomValue > 0 ? localCustomValue : 1;
        current.add(increment, "months");
        break;
      }
      case "on a recurring cycle": {
        dates.push(moment(current).format("MM/DD/YYYY"));
        // Minimal example to avoid infinite loop
        current.add(1, "day");
        break;
      }
      default:
        // Fallback: treat like "Every day"
        dates.push(moment(current).format("MM/DD/YYYY"));
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