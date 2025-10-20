import React, { useState } from "react";
import {
  View,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Modal,
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
  computeEndWindow,
} from "~/src/services/reminderSchedule";
import { getFromStorage } from "~/src/services/storage";
import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
import {
  TypeList,
  intervalToTakeList,
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
import { DaySelector } from "~/components/custom/DaySelector";
import { usePremiumGate } from "~/src/hooks/usePremiumGate";

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
  const [showTime, setShowTime] = useState<number | false>(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* ───────────── Premium hook ───────────── */
  const { isPremium, guard } = usePremiumGate();

  /* ───────────── Form state ───────────── */
  const init = defaultValues ?? {};
  const [formData, setFormData] = useState<FormData>({
    medicationName: init.medicationName ?? "",
    medicationType: init.medicationType ?? "",
    intakeInterval: init.intakeInterval ?? "",
    startDate: init.startDate ? new Date(init.startDate) : undefined,
    endDate: init.endDate ? new Date(init.endDate) : undefined,
    reminderTimes: init.reminderTimes ?? [formatTime(new Date())],
    customIntervalValue: init.customInterval
      ? String(init.customInterval) // convert number → string
      : "",
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
      intakeInterval,
      startDate,
      endDate,
    } = formData;

    if (!(medicationName && medicationType && intakeInterval)) {
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
      const DAY_MS = 24 * 60 * 60 * 1000; // 86_400_000, convers from miliseconds to days
      const windowStart = new Date(now.getTime() - 7 * DAY_MS);
      const { effectiveEnd, windowEnd } = computeEndWindow(
        formData.endDate,
        now,
        14
      );

      await updateDoc(medRef, {
        medicationName,
        medicationType,
        intakeInterval,
        customInterval: parseInt(formData.customIntervalValue || "1", 10),
        specificDaysOfWeek: formData.specificDaysOfWeek,
        startDate: Timestamp.fromDate(startDate ?? new Date()),
        endDate: endDate ? Timestamp.fromDate(endDate) : null,
        reminderTimes: formData.reminderTimes,
        updatedAt: serverTimestamp(),
        uid: user.uid,
        userEmail: user.email ?? "",
        chunkEndDate: Timestamp.fromDate(effectiveEnd),
      });

      // 1. Generate desired dates in window
      // For each reminderTime, generate dates and pair with time
      const reminderTimes = formData.reminderTimes || [];
      const desiredPairs: { date: Date; time: string }[] = [];
      for (const reminderTime of reminderTimes) {
        const dates = generateReminderDates(
          startDate ?? new Date(),
          effectiveEnd,
          intakeInterval,
          {
            customIntervalValue: parseInt(
              formData.customIntervalValue || "1",
              10
            ),
            specificDaysOfWeek: formData.specificDaysOfWeek,
          }
        ).filter((d) => toDate(d) >= windowStart);
        for (const d of dates) {
          desiredPairs.push({ date: toDate(d), time: reminderTime });
        }
      }
      // Use ISO date+time as unique key
      const desiredSet = new Set(
        desiredPairs.map(
          ({ date, time }) => date.toISOString().slice(0, 10) + "|" + time
        )
      );

      // 2. Fetch existing reminders in window
      const snap = await getDocs(
        query(
          collection(db, "reminders"),
          where("uid", "==", user.uid),
          where("medId", "==", medId),
          where("date", ">=", Timestamp.fromDate(windowStart)),
          where("date", "<=", Timestamp.fromDate(windowEnd))
        )
      );

      // Map of "YYYY-MM-DD|hh:mm" -> docId
      const exists = new Map<string, string>();
      snap.forEach((d) => {
        const data = d.data();
        const dateStr = toDate(data.date).toISOString().slice(0, 10);
        const timeStr = data.time;
        exists.set(dateStr + "|" + timeStr, d.id);
      });

      // 3. Delete outdated
      await Promise.all(
        Array.from(exists.entries())
          .filter(([key]) => !desiredSet.has(key))
          .map(([_, id]) => deleteDoc(doc(db, "reminders", id)))
      );

      // 3b.  UPDATE + RESCHEDULE EXISTING REMINDERS (same date, but when data changed)
      await Promise.all(
        Array.from(exists.entries())
          .filter(([key]) => desiredSet.has(key)) // still a valid date|time
          .map(async ([key, id]) => {
            const reminderRef = doc(db, "reminders", id);
            const snapDoc = await getDoc(reminderRef);
            const data = snapDoc.data();
            // Extract correct time from key
            const [dateStr, timeStr] = key.split("|");
            const needsReschedule = data && data.time !== timeStr;

            // Always update Firestore fields
            await updateDoc(reminderRef, {
              time: timeStr,
              uid: user.uid,
              userEmail: user.email ?? "",
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
                date: new Date(dateStr),
                time: timeStr,
                medId,
                notificationId: null,
              });
            }
          })
      );

      // 4. Create missing & schedule future
      await Promise.all(
        desiredPairs
          .filter(
            ({ date, time }) =>
              !exists.has(date.toISOString().slice(0, 10) + "|" + time)
          )
          .map(async ({ date, time }) => {
            const ref = await addDoc(collection(db, "reminders"), {
              date: Timestamp.fromDate(date),
              time,
              status: "pending",
              medId,
              uid: user.uid,
              userEmail: user.email ?? "",
              notificationId: null,
            });
            if (date > now) {
              await scheduleMedicationReminder({
                id: ref.id,
                uid: user.uid,
                date,
                time,
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
  const remove = async () => {
    if (!defaultValues?.id) return;
    setLoading(true);
    try {
      const user = await getFromStorage("userDetails");
      if (!user?.uid) throw new Error("User missing");
      const medId = defaultValues.id;

      // 1. delete reminders & cancel notifications
      const snap = await getDocs(
        query(
          collection(db, "reminders"),
          where("uid", "==", user.uid),
          where("medId", "==", medId)
        )
      );
      await Promise.all(
        snap.docs.map(async (d) => {
          const nId = d.data().notificationId;
          if (nId) await Notifications.cancelScheduledNotificationAsync(nId);
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
  };

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
    <View className="mb-4 space-y-1">
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

  // ───────────── Modal Component ─────────────
  const ConfirmModal = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Confirm",
    cancelText = "Cancel",
    confirmVariant = "default",
  }: {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: "default" | "destructive";
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 24,
            minWidth: 280,
            alignItems: "center",
          }}
        >
          <Text className="text-lg font-bold mb-2">{title}</Text>
          <Text className="mb-6 text-center">{message}</Text>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Button
              variant="outline"
              onPress={onClose}
              style={{ minWidth: 90, marginRight: 8 }}
            >
              <Text>{cancelText}</Text>
            </Button>
            <Button
              variant={confirmVariant}
              onPress={onConfirm}
              style={{ minWidth: 90 }}
            >
              <Text>{confirmText}</Text>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, paddingBottom: 36 + insets.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Name */}
      <Label>Medication name</Label>
      <Input
        className="mb-4"
        placeholder="Name"
        value={formData.medicationName}
        onChangeText={(v) => handle("medicationName", v)}
      />

      {/* Type, Interval */}
      <SelectRow
        label="Medication type"
        list={TypeList}
        field="medicationType"
      />
      <SelectRow
        label="Frequency"
        list={intervalToTakeList}
        field="intakeInterval"
      />

      {/* Interval-specific extra UI */}
      {formData.intakeInterval === "Specific days weekly" && (
        <DaySelector
          selectedDays={formData.specificDaysOfWeek}
          onToggleDay={toggleDay}
        />
      )}

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
      <Pressable
        onPress={() => setShowStart(true)}
        className="py-2 px-4 bg-white rounded-3xl mb-4"
      >
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
      <Pressable
        onPress={() => setShowEnd(true)}
        className="py-2 px-4 bg-white rounded-3xl mb-4"
      >
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

      <Label>Reminder times</Label>
      {(formData.reminderTimes || []).map((reminderTime, idx) => (
        <View key={idx} className="flex-row items-center mb-2">
          <Pressable
            onPress={() => {
              setShowTime(idx + 1); // showTime is index+1 (0 = not shown)
            }}
            className="py-2 px-4 bg-white rounded-3xl flex-1"
          >
            <Text>{reminderTime}</Text>
          </Pressable>
          {formData.reminderTimes.length > 1 && (
            <TouchableOpacity
              onPress={() =>
                guard(() => {
                  setFormData((prev) => ({
                    ...prev,
                    reminderTimes: prev.reminderTimes.filter(
                      (_, i) => i !== idx
                    ),
                  }));
                })
              }
              style={{ marginLeft: 8 }}
            >
              <Text style={{ color: "red" }}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
      <Button
        onPress={() =>
          guard(() => {
            setFormData((prev) => ({
              ...prev,
              reminderTimes: [...prev.reminderTimes, formatTime(new Date())],
            }));
          })
        }
        variant="outline"
        className="mb-4"
      >
        <Text>Add time</Text>
      </Button>
      {/* Show DatePicker for each time */}
      {(formData.reminderTimes || []).map((reminderTime, idx) => (
        <DatePicker
          key={idx}
          modal
          open={showTime === idx + 1}
          date={timeStringToDate(reminderTime)}
          mode="time"
          onConfirm={(d) => {
            setShowTime(false);
            setFormData((prev) => {
              const arr = [...prev.reminderTimes];
              arr[idx] = formatTime(d);
              return { ...prev, reminderTimes: arr };
            });
          }}
          onCancel={() => setShowTime(false)}
        />
      ))}

      {/* Action buttons */}
      <Button
        onPress={() => setShowSaveModal(true)}
        disabled={loading}
        className="mb-4 mt-2"
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text>Save</Text>}
      </Button>
      <Button
        onPress={() => setShowDeleteModal(true)}
        variant="destructive"
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text>Delete</Text>}
      </Button>

      {/* =====Save Confirmation Modal===== */}
      <ConfirmModal
        visible={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onConfirm={async () => {
          setShowSaveModal(false);
          await save();
        }}
        title="Save changes?"
        message="Are you sure you want to save changes to this medication?"
        confirmText="Save"
        cancelText="Cancel"
        confirmVariant="default"
      />
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={async () => {
          setShowDeleteModal(false);
          await remove();
        }}
        title="Delete medication?"
        message="Remove medication and all reminders? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="destructive"
      />
    </ScrollView>
  );
}
