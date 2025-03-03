export function getDateTimeFromReminder(reminder: any): Date {
  const datePart = reminder.date.toDate(); // Convert Firestore Timestamp to JS Date
  const [hours, minutes] = reminder.time.split(":").map(Number);

  // Create a new Date with the same year/month/day as 'datePart'
  // plus the hours/minutes from reminder.time
  const scheduledDate = new Date(
    datePart.getFullYear(),
    datePart.getMonth(),
    datePart.getDate(),
    hours,
    minutes,
    0
  );

  return scheduledDate;
}
