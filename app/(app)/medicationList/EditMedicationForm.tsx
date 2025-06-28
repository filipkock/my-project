import React, { useState } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DatePicker from "react-native-date-picker";
import Toast from "react-native-toast-message";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

import { db } from "~/config/firebase";
import {
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  Timestamp,
  serverTimestamp,
  collection,
  getDoc,
} from "firebase/firestore";

import {
  generateReminderDates,
  formatTime,
  timeStringToDate,
} from "~/src/services/reminderSchedule";
import { getFromStorage } from "~/src/services/storage";
import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
import {
  TypeList,
  WhenToTakeList,
  intervalToTakeList,
  dayLabels,
} from "~/src/constants/addMedicationOptions";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Text } from "~/components/ui/text";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "~/components/ui/select";

import type { FormData } from "~/src/types/medication";

const toDate = (d: Timestamp | Date): Date =>
  d instanceof Timestamp ? d.toDate() : d;

interface Props {
  defaultValues?: Partial<FormData> & { id?: string };
  onSuccess?: () => void;
}

export default function EditMedicationForm({
  defaultValues,
  onSuccess = () => {},
}: Props) {
  /* ───────────── UI helpers ───────────── */
  const insets = useSafeAreaInsets();
  const [triggerWidth, setTriggerWidth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showStart, setShowStart] = useState(false);
  const [showEnd, setShowEnd] = useState(false);
  const [showTime, setShowTime] = useState(false);

  /* ───────────── Form state ───────────── */
  const init = defaultValues ?? {};
  const [formData, setFormData] = useState<FormData>({
    medicationName: init.medicationName ?? "",
    medicationType: init.medicationType ?? "",
    whenToTake: init.whenToTake ?? "",
    intakeInterval: init.intakeInterval ?? "",
    startDate: init.startDate ? new Date(init.startDate) : undefined,
    endDate: init.endDate ? new Date(init.endDate) : undefined,
    reminderTime: init.reminderTime ?? formatTime(new Date()),
    customIntervalValue: init.customIntervalValue ?? "",
    specificDaysOfWeek: init.specificDaysOfWeek ?? [],
  });

  const handle = (field: keyof FormData, value: any) =>
    setFormData((p) => ({ ...p, [field]: value }));

  /* ───────────── Toggle weekly days ───────────── */
  const toggleDay = (idx: number) =>
    setFormData((p) => {
      const arr = p.specificDaysOfWeek.includes(idx)
        ? p.specificDaysOfWeek.filter((d) => d !== idx)
        : [...p.specificDaysOfWeek, idx];
      return { ...p, specificDaysOfWeek: arr };
    });

  /* ───────────── SAVE (update) ───────────── */
  const save = async () => {
    const {
      medicationName,
      medicationType,
      whenToTake,
      intakeInterval,
      startDate,
      endDate,
    } = formData;

    if (!(medicationName && medicationType && whenToTake && intakeInterval)) {
      Alert.alert("Missing fields", "Fill in required fields.");
      return;
    }

    setLoading(true);
    try {
      const user = await getFromStorage("userDetails");
      if (!user?.uid) throw new Error("User missing");

      /* --- Update medication doc --- */
      if (!defaultValues?.id) throw new Error("Missing med ID");
      const medId = defaultValues.id;
      const medRef = doc(db, "medication", medId);

      /* --- Reconcile reminders (-7 → +14 days) --- */
      const now = new Date();
      const windowStart = new Date(now.getTime() - 7 * 864e5);
      const windowEnd = new Date(now.getTime() + 14 * 864e5);

      await updateDoc(medRef, {
        medicationName,
        medicationType,
        whenToTake,
        intakeInterval,
        customInterval: parseInt(formData.customIntervalValue || "1", 10),
        specificDaysOfWeek: formData.specificDaysOfWeek,
        startDate: Timestamp.fromDate(startDate ?? new Date()),
        endDate: endDate ? Timestamp.fromDate(endDate) : null,
        time: formData.reminderTime,
        updatedAt: serverTimestamp(),
        uid: user.uid,
        userEmail: user.email,
        chunkEndDate: Timestamp.fromDate(windowEnd),
      });

      // 1. Generate desired dates in window
      const desired = generateReminderDates(
        startDate ?? new Date(),
        windowEnd,
        intakeInterval,
        {
          customIntervalValue: parseInt(
            formData.customIntervalValue || "1",
            10
          ),
          specificDaysOfWeek: formData.specificDaysOfWeek,
        }
      ).filter((d) => toDate(d) >= windowStart);

      const desiredSet = new Set(desired.map((d) => toDate(d).toISOString()));

      // 2. Fetch existing reminders in window
      const snap = await getDocs(
        query(
          collection(db, "reminders"),
          where("medId", "==", medId),
          where("date", ">=", Timestamp.fromDate(windowStart)),
          where("date", "<=", Timestamp.fromDate(windowEnd))
        )
      );

      const exists = new Map<string, string>(); // iso -> docId
      snap.forEach((d) =>
        exists.set(toDate(d.data().date).toISOString(), d.id)
      );

      // 3. Delete outdated
      await Promise.all(
        Array.from(exists.entries())
          .filter(([iso]) => !desiredSet.has(iso))
          .map(([_, id]) => deleteDoc(doc(db, "reminders", id)))
      );

      // 3b.  UPDATE + RESCHEDULE EXISTING REMINDERS (same date, but when data changed)
      await Promise.all(
        Array.from(exists.entries())
          .filter(([iso]) => desiredSet.has(iso)) // still a valid date
          .map(async ([iso, id]) => {
            const reminderRef = doc(db, "reminders", id);
            const snapDoc = await getDoc(reminderRef);
            const data = snapDoc.data();

            const needsReschedule =
              data &&
              (data.time !== formData.reminderTime ||
                data.whenToTake !== whenToTake);

            // Always update Firestore fields
            await updateDoc(reminderRef, {
              time: formData.reminderTime,
              whenToTake,
              updatedAt: serverTimestamp(),
            });

            // If fields changed, cancel old notif and schedule a new one
            if (needsReschedule) {
              if (data.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(
                  data.notificationId
                );
              }

              await scheduleMedicationReminder({
                id,
                uid: user.uid,
                date: new Date(iso),
                time: formData.reminderTime,
                whenToTake,
                medId,
                notificationId: null, // scheduleMedicationReminder will write back
              });
            }
          })
      );

      // 4. Create missing & schedule future
      await Promise.all(
        desired
          .filter((d) => !exists.has(toDate(d).toISOString()))
          .map(async (d) => {
            const ref = await addDoc(collection(db, "reminders"), {
              date: Timestamp.fromDate(toDate(d)),
              time: formData.reminderTime,
              whenToTake,
              status: "pending",
              medId,
              uid: user.uid,
              userEmail: user.email,
              notificationId: null,
            });
            if (toDate(d) > now) {
              await scheduleMedicationReminder({
                id: ref.id,
                uid: user.uid,
                date: d,
                time: formData.reminderTime,
                whenToTake,
                medId,
                notificationId: null,
              });
            }
          })
      );

      Toast.show({ type: "plain", text1: "Medication updated" });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err.message || "Could not save.");
    } finally {
      setLoading(false);
    }
  };

  /* ───────────── DELETE ───────────── */
  const remove = () =>
    Alert.alert("Delete", "Remove medication and all reminders?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!defaultValues?.id) return;
          setLoading(true);
          try {
            const medId = defaultValues.id;

            // 1. delete reminders & cancel notifications
            const snap = await getDocs(
              query(collection(db, "reminders"), where("medId", "==", medId))
            );
            await Promise.all(
              snap.docs.map(async (d) => {
                const nId = d.data().notificationId;
                if (nId)
                  await Notifications.cancelScheduledNotificationAsync(nId);
                await deleteDoc(d.ref);
              })
            );
            // 2. delete medication doc
            await deleteDoc(doc(db, "medication", medId));

            Toast.show({ type: "plain", text1: "Medication deleted" });
            onSuccess();
          } catch (e) {
            console.error(e);
            Alert.alert("Error", "Could not delete.");
          } finally {
            setLoading(false);
          }
        },
      },
    ]);

  /* ───────────── Render helpers ───────────── */
  const SelectRow = ({
    label,
    list,
    field,
  }: {
    label: string;
    list: string[];
    field: keyof FormData;
  }) => (
    <View className="space-y-1">
      <Label>{label}</Label>
      <Select
        value={
          typeof formData[field] === "string" && formData[field]
            ? {
                label: formData[field] as string,
                value: formData[field] as string,
              }
            : undefined
        }
        onValueChange={(opt) => handle(field, opt?.value)}
      >
        <SelectTrigger
          onLayout={(e) => setTriggerWidth(e.nativeEvent.layout.width)}
        >
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent style={{ width: triggerWidth }}>
          <SelectGroup>
            {list.map((item) => (
              <SelectItem key={item} label={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </View>
  );

  const DayButtons = () => (
    <View>
      <Label>Select weekly days (tap):</Label>
      <View className="flex-row flex-wrap mt-2">
        {dayLabels.map((lbl, i) => {
          const sel = formData.specificDaysOfWeek.includes(i);
          return (
            <TouchableOpacity
              key={i}
              style={{
                marginRight: 8,
                marginBottom: 8,
                padding: 8,
                borderWidth: 1,
                borderColor: sel ? "green" : "gray",
                borderRadius: 4,
              }}
              onPress={() => toggleDay(i)}
            >
              <Text style={{ color: sel ? "green" : "black" }}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View className="p-4">
      {/* Name */}
      <Label>Medication name</Label>
      <Input
        placeholder="Name"
        value={formData.medicationName}
        onChangeText={(v) => handle("medicationName", v)}
      />

      {/* Type, When, Interval */}
      <SelectRow
        label="Medication type"
        list={TypeList}
        field="medicationType"
      />
      <SelectRow
        label="When to take"
        list={WhenToTakeList}
        field="whenToTake"
      />
      <SelectRow
        label="Frequency"
        list={intervalToTakeList}
        field="intakeInterval"
      />

      {/* Interval-specific extra UI */}
      {formData.intakeInterval === "Specific days weekly" && <DayButtons />}

      {/* Custom interval numeric */}
      {["every X days", "every X weeks", "every X months"].includes(
        formData.intakeInterval
      ) && (
        <>
          <Label>Enter X (number)</Label>
          <Input
            keyboardType="numeric"
            value={formData.customIntervalValue}
            onChangeText={(v) => handle("customIntervalValue", v)}
          />
        </>
      )}

      {/* Start / End / Time pickers */}
      <Label>Start date</Label>
      <Pressable onPress={() => setShowStart(true)} className="py-2 bg-white">
        <Text>
          {formData.startDate
            ? formData.startDate.toDateString()
            : "No start date"}
        </Text>
      </Pressable>
      <DatePicker
        modal
        open={showStart}
        date={formData.startDate ?? new Date()}
        mode="date"
        onConfirm={(d) => {
          setShowStart(false);
          handle("startDate", d);
        }}
        onCancel={() => setShowStart(false)}
      />

      <Label>End date</Label>
      <Pressable onPress={() => setShowEnd(true)} className="py-2 bg-white">
        <Text>{formData.endDate?.toDateString() || "No end date"}</Text>
      </Pressable>
      <DatePicker
        modal
        open={showEnd}
        date={formData.endDate ?? new Date()}
        mode="date"
        onConfirm={(d) => {
          setShowEnd(false);
          handle("endDate", d);
        }}
        onCancel={() => setShowEnd(false)}
      />

      <Label>Reminder time</Label>
      <Pressable onPress={() => setShowTime(true)} className="py-2 bg-white">
        <Text>{formData.reminderTime}</Text>
      </Pressable>
      <DatePicker
        modal
        open={showTime}
        date={timeStringToDate(formData.reminderTime ?? formatTime(new Date()))}
        mode="time"
        onConfirm={(d) => {
          setShowTime(false);
          handle("reminderTime", formatTime(d));
        }}
        onCancel={() => setShowTime(false)}
      />

      {/* Action buttons */}
      <Button onPress={save} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text>Save</Text>}
      </Button>
      <Button onPress={remove} variant="destructive" disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text>Delete</Text>}
      </Button>
    </View>
  );
}
