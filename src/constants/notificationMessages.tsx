// Poka messages for flexible daily medication routines
const dailyMessages = [
  "Uhm... i-it’s time for your medicine 🐧",
  "P‑poke... h‑hey, it’s dose time 🐧",
  "O-oh! D‑don’t forget your medicine, okay? 🐧",
  "J‑just checking... it’s time for your meds 🐧",
  "O-oh! Your dose... it’s time now 🐧",
  "I think... now’s a good time for your dose 🐧",
  "P‑poke... time to take your medicine 🐧",
];

export default function getNotificationBody(): string {
  return dailyMessages[Math.floor(Math.random() * dailyMessages.length)];
}
