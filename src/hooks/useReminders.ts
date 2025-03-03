// This can be used to set up and schedule reminder again after app is mounted. Can be relevant if e.g. if user remove and install computer again
// removed for now as not needed atm

// import { useEffect, useState } from "react";
// import { db } from "~/config/firebase";
// import { collection, query, where, onSnapshot } from "firebase/firestore";

// export function useReminders(uid?: string) {
//   const [reminders, setReminders] = useState<any[]>([]);

//   useEffect(() => {
//     // ✅ Only run Firestore listener if uid is available
//     if (!uid) {
//       setReminders([]); //Clear reminders if no user is authenticated
//       return;
//     }

//     console.log("Fetching reminders for user:", uid);

//     // ✅ Firestore query (filter directly in the database)
//     const now = new Date();
//     const remindersQuery = query(
//       collection(db, "reminders"),
//       where("uid", "==", uid), // Only fetch reminders for the current user
//       where("notificationId", "==", null), // Only fetch reminders without notificationId
//       where("date", ">=", now) // Fetch only FUTURE reminders
//     );

//     const unsubscribe = onSnapshot(
//       remindersQuery,
//       (snapshot) => {
//         const docs = snapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));

//         console.log(`Fetched ${docs.length} reminders`);
//         setReminders(docs);
//       },
//       (error) => {
//         console.error("Error fetching reminders: ", error);
//       }
//     );

//     return () => {
//       console.log("Unsubscribing from reminders listener");
//       unsubscribe(); // Cleanup Firestore listener
//     };
//   }, [uid]);

//   return reminders;
// }
