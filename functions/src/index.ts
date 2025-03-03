/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// ===== start of my own code ======

// import * as admin from "firebase-admin";
// import fetch from "node-fetch";
// import { onSchedule } from "firebase-functions/v2/scheduler";

// admin.initializeApp();
// const db = admin.firestore();

// exports.sendMedicationReminders = onSchedule(
//   { schedule: "every 1 minutes" }, // Runs every minute
//   async (event) => {
//     const now = new Date();
//     const hours = now.getHours().toString().padStart(2, "0");
//     const minutes = now.getMinutes().toString().padStart(2, "0");
//     const currentTime = `${hours}:${minutes}`;

//     const startOfToday = new Date();
//     startOfToday.setHours(0, 0, 0, 0);
//     const endOfToday = new Date();
//     endOfToday.setHours(23, 59, 59, 999);

//     const remindersSnapshot = await db
//       .collection("reminders")
//       .where("time", "==", currentTime)
//       .where("status", "==", "pending")
//       .where("date", ">=", admin.firestore.Timestamp.fromDate(startOfToday))
//       .where("date", "<=", admin.firestore.Timestamp.fromDate(endOfToday))
//       .get();

//     if (remindersSnapshot.empty) return;

//     const messages: any[] = [];

//     for (const doc of remindersSnapshot.docs) {
//       const reminder = doc.data();
//       const userDoc = await db.collection("users").doc(reminder.uid).get();
//       if (!userDoc.exists) continue;

//       const userData = userDoc.data();
//       if (!userData) continue;
//       const expoPushToken = userData.expoPushToken;
//       if (!expoPushToken) continue;

//       messages.push({
//         to: expoPushToken,
//         sound: "default",
//         title: "Medication Reminder 💊",
//         body: `Time to take your ${reminder.whenToTake} dose!`,
//         data: { medId: reminder.medId },
//       });

//       await db.collection("reminders").doc(doc.id).update({ status: "sent" });
//     }

//     if (messages.length > 0) {
//       await Promise.all(
//         messages.map((message) =>
//           fetch("https://exp.host/--/api/v2/push/send", {
//             method: "POST",
//             headers: {
//               Accept: "application/json",
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify(message),
//           })
//         )
//       );
//     }
//     return;
//   }
// );
