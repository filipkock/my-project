// Poka messages for flexible daily medication routines
const dailyMessages = [
  "Poke! Time to take one of your doses today 👉",
  "Poka poke! A reminder to take one of your doses today ✨",
  "Hey! Stay on track, time for one of your doses 🚀",
  "You've got this! Time to take a dose 💪",
];

const timedMessages = [
  "Poka poke! It's __WHEN__ — time to take your dose 👉",
  "Poke! It's __WHEN__, time for your dose ✨",
  "Reminder from Poka: Take your __WHEN__ dose 🙌",
  "Quick poke! Time for your __WHEN__ dose 💪",
];

export default function getNotificationBody(reminder: {
  whenToTake?: string;
}): string {
  if (reminder.whenToTake === "Throughout the day") {
    return dailyMessages[Math.floor(Math.random() * dailyMessages.length)];
  }
  const msg = timedMessages[Math.floor(Math.random() * timedMessages.length)];
  return msg.replace("__WHEN__", reminder.whenToTake?.toLowerCase() || "now");
}
