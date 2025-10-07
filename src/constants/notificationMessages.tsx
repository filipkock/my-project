// Poka messages for flexible daily medication routines
const dailyMessages = [
  "Um... medicine time, maybe? 🐧",
  "Poke poke... did you take it yet? 🐧",
  "Hey... time for meds 🐧",
  "Psst... don’t forget your dose! 🐧",
  "One little dose to keep going 🐧",
  "Poka’s worried... take your meds? 🐧",
  "Oh! Sorry—just reminding you 🐧",
  "Hehe... dose time, okay? 🐧",
  "Poke... medicine time! 🐧",
];

export default function getNotificationBody(): string {
  return dailyMessages[Math.floor(Math.random() * dailyMessages.length)];
}
