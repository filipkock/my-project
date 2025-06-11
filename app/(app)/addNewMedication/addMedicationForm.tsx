import React from "react";
import { View, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { Input } from "~/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
  TypeList,
  WhenToTakeList,
  intervalToTakeList,
  dayLabels,
} from "~/src/constants/addMedicationOptions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import DatePicker from "react-native-date-picker";
import {} from "react-native";
import { getFromStorage } from "~/src/services/storage";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  getDocs,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";

/** Convert Firestore Timestamp | Date to a JS Date */
const toDate = (d: Timestamp | Date): Date =>
  d instanceof Timestamp ? d.toDate() : d;
import { db } from "~/config/firebase";
import {
  generateReminderDates,
  formatTime,
  timeStringToDate,
} from "~/src/services/reminderSchedule";
import { useState } from "react";
import { Pressable } from "react-native";
import { scheduleMedicationReminder } from "~/src/utils/scheduleMedicationReminder";
import type { FormData } from "~/src/types/medication";

// Helper function to log reminder changes
const logReminderChange = (
  type: "created" | "deleted" | "updated",
  date: Date,
  id?: string
) => {
  const prefix = type === "created" ? "➕" : type === "deleted" ? "🗑️" : "🔄";
  const idPart = id ? ` (id: ${id})` : "";
  console.log(
    `${prefix} ${type.toUpperCase()} reminder: ${date.toISOString()}${idPart}`
  );
};

// Accept props: defaultValues, onSuccess, onCancel
const AddMedicationForm = ({
  defaultValues,
  onSuccess = () => {},
  onCancel,
}: {
  defaultValues?: Partial<FormData> & { id?: string };
  onSuccess?: () => void;
  onCancel?: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const [triggerWidth, setTriggerWidth] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<Boolean>(false);

  // To hide or show the date and time selectors on andriod
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // FORM STORING LOGIC
  // ------------------------------------------------
  const defaultValuesTyped: Partial<FormData> & { id?: string } =
    defaultValues || {};
  const initialValues = defaultValuesTyped as Partial<FormData>;

  const [formData, setFormData] = React.useState<FormData>({
    medicationName: initialValues.medicationName ?? "",
    medicationType: initialValues.medicationType ?? "",
    whenToTake: initialValues.whenToTake ?? "",
    intakeInterval: initialValues.intakeInterval ?? "",
    startDate: initialValues.startDate
      ? new Date(initialValues.startDate)
      : new Date(),
    endDate: initialValues.endDate
      ? new Date(initialValues.endDate)
      : new Date(),
    reminderTime: initialValues.reminderTime ?? formatTime(new Date()),
    customIntervalValue: initialValues.customIntervalValue ?? "",
    specificDaysOfWeek: initialValues.specificDaysOfWeek ?? [],
  });

  const onHandleInputChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // CUSTOM INTERVALS LOGIC
  // ------------------------------------------------
  const toggleDaySelection = (dayIndex: number) => {
    setFormData((prev) => {
      const { specificDaysOfWeek } = prev;
      if (specificDaysOfWeek.includes(dayIndex)) {
        // remove dayIndex
        return {
          ...prev,
          specificDaysOfWeek: specificDaysOfWeek.filter((d) => d !== dayIndex),
        };
      } else {
        // add dayIndex
        return {
          ...prev,
          specificDaysOfWeek: [...specificDaysOfWeek, dayIndex],
        };
      }
    });
  };

  // STORE IN FIRESTORE
  // ------------------------------------------------
  /**
   * Save Medication Reminder
   * -------------------------
   * This function handles both creating a new medication reminder
   * and updating an existing one if `defaultValues.id` is provided.
   *
   * Steps:
   * 1. Validate form fields.
   * 2. Parse user info from local storage.
   * 3. Generate reminder dates based on intake interval and settings.
   * 4. If updating:
   *    - Update medication document.
   *    - Fetch and reconcile reminders (delete outdated, create new, update existing).
   * 5. If creating:
   *    - Create medication document.
   *    - Create associated reminders.
   * 6. Schedule notifications for future reminders.
   * 7. Display success message or error alert.
   */
  const saveMedicationReminder = async () => {
    // Step 1: Validate required fields
    const {
      medicationName,
      medicationType,
      whenToTake,
      intakeInterval,
      startDate,
      endDate,
    } = formData;

    const requiredFieldsFilled =
      medicationName &&
      medicationType &&
      whenToTake &&
      intakeInterval &&
      startDate &&
      endDate;

    if (!requiredFieldsFilled) {
      Alert.alert("Empty fields", "Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      // Step 2: Retrieve user information from local storage
      const userinfo = await getFromStorage("userDetails");

      // Step 3: Generate reminder dates
      const customInterval =
        parseInt(formData.customIntervalValue || "1", 10) || 1;
      // Ensure startDate and endDate are Date objects
      const realStartDate = toDate(startDate);
      const realEndDate = toDate(endDate);
      const now = new Date();
      const reminders = generateReminderDates(
        realStartDate,
        realEndDate,
        intakeInterval,
        {
          customIntervalValue: customInterval,
          specificDaysOfWeek: formData.specificDaysOfWeek,
        }
      );
      // Step 4: Update existing medication and associated reminders
      if (defaultValues?.id) {
        // Update existing medication
        const medicationRef = doc(db, "medication", defaultValues.id);
        await updateDoc(medicationRef, {
          medicationName,
          medicationType,
          whenToTake,
          intakeInterval,
          customInterval,
          specificDaysOfWeek: formData.specificDaysOfWeek || [],
          startDate: Timestamp.fromDate(realStartDate),
          endDate: Timestamp.fromDate(realEndDate),
          time: formData.reminderTime,
          updatedAt: serverTimestamp(),
          userEmail: userinfo?.email,
          uid: userinfo.uid,
        });

        // Fetch existing reminders
        const reminderQuery = query(
          collection(db, "reminders"),
          where("medId", "==", defaultValues.id)
        );
        const reminderSnapshot = await getDocs(reminderQuery);

        // Convert existing to ISO map for comparison
        const existingRemindersMap = new Map<string, string>(); // iso → docId
        reminderSnapshot.docs.forEach((doc) => {
          const raw = doc.data().date as Timestamp | Date;
          const dateIso = toDate(raw).toISOString();
          existingRemindersMap.set(dateIso, doc.id);
        });

        // Desired reminders ISO
        const validRemindersSet = new Set(
          reminders.map((r) => toDate(r).toISOString())
        );

        // Delete reminders that no longer match
        const deletePromises = [];
        for (const [dateIso, docId] of existingRemindersMap.entries()) {
          if (!validRemindersSet.has(dateIso)) {
            deletePromises.push(
              deleteDoc(doc(db, "reminders", docId)).then(() => {
                logReminderChange("deleted", toDate(new Date(dateIso)), docId);
              })
            );
          }
        }

        // Add new reminders that don't already exist
        const newReminderPromises = reminders
          .filter(
            (reminderDate) =>
              !existingRemindersMap.has(toDate(reminderDate).toISOString())
          )
          .map(async (reminderDate) => {
            const reminderDocRef = await addDoc(collection(db, "reminders"), {
              date: reminderDate,
              time: formData.reminderTime,
              whenToTake: formData.whenToTake,
              status: "pending",
              medId: defaultValues.id,
              uid: userinfo.uid,
              userEmail: userinfo.email,
              notificationId: null,
            });

            // Step 6: Schedule notifications for valid future reminders
            if (toDate(reminderDate).getTime() > now.getTime()) {
              await scheduleMedicationReminder({
                id: reminderDocRef.id,
                uid: userinfo.uid,
                date: reminderDate,
                time: formData.reminderTime,
                whenToTake: formData.whenToTake,
                medId: defaultValues.id!,
                notificationId: null,
              });
            }
            logReminderChange(
              "created",
              toDate(reminderDate),
              reminderDocRef.id
            );
          });

        await Promise.all([...deletePromises, ...newReminderPromises]);

        // Update existing reminders with new time/whenToTake and reschedule notifications
        const updateExistingPromises = [];
        for (const [dateIso, docId] of existingRemindersMap.entries()) {
          if (validRemindersSet.has(dateIso)) {
            const reminderRef = doc(db, "reminders", docId);
            const updatedReminder = {
              time: formData.reminderTime,
              whenToTake: formData.whenToTake,
            };
            updateExistingPromises.push(
              updateDoc(reminderRef, updatedReminder).then(() => {
                // Find the reminderData for log
                const reminderData = reminderSnapshot.docs
                  .find((d) => d.id === docId)
                  ?.data();
                if (reminderData) {
                  logReminderChange(
                    "updated",
                    toDate(reminderData.date),
                    docId
                  );
                }
              })
            );

            // Step 6: Schedule notifications for valid future reminders
            const reminderData = reminderSnapshot.docs
              .find((d) => d.id === docId)
              ?.data();
            if (reminderData) {
              const reminderToSchedule = {
                ...reminderData,
                ...updatedReminder,
                id: docId,
                uid: reminderData.uid,
                date: reminderData.date,
                medId: reminderData.medId,
                notificationId: reminderData.notificationId ?? null,
              };
              updateExistingPromises.push(
                scheduleMedicationReminder(reminderToSchedule)
              );
            }
          }
        }
        await Promise.all(updateExistingPromises);
      } else {
        // Step 5: Create new medication and associated reminders
        const medicationRef = await addDoc(collection(db, "medication"), {
          medicationName,
          medicationType,
          whenToTake,
          intakeInterval,
          customInterval,
          specificDaysOfWeek: formData.specificDaysOfWeek || [],
          startDate: Timestamp.fromDate(realStartDate),
          endDate: Timestamp.fromDate(realEndDate),
          userEmail: userinfo?.email,
          createdAt: serverTimestamp(),
          uid: userinfo.uid,
          time: formData.reminderTime,
        });

        // 4️⃣ Save Each Reminder in Firestore & Schedule Notification
        const remindersCollectionRef = collection(db, "reminders");

        const reminderWrites = reminders.map(async (reminderDate) => {
          // Add userEmail and uid for new reminders (consistency)
          if (!userinfo?.email || !userinfo?.uid) {
            throw new Error("Missing user information for reminder creation");
          }
          const reminderDocRef = await addDoc(remindersCollectionRef, {
            date: reminderDate,
            time: formData.reminderTime,
            whenToTake: formData.whenToTake,
            status: "pending",
            medId: medicationRef.id,
            uid: userinfo.uid,
            userEmail: userinfo.email,
            notificationId: null,
          });

          // Step 6: Schedule notifications for valid future reminders
          if (toDate(reminderDate).getTime() > now.getTime()) {
            await scheduleMedicationReminder({
              id: reminderDocRef.id, // Firestore document ID
              uid: userinfo.uid,
              date: reminderDate,
              time: formData.reminderTime,
              whenToTake: formData.whenToTake,
              medId: medicationRef.id,
              notificationId: null,
            });
          }
          logReminderChange("created", toDate(reminderDate), reminderDocRef.id);
        });

        await Promise.all(reminderWrites);

        // Step 7: Show success message and trigger callback
        Alert.alert("Success!", "Medication reminder was created", [
          {
            text: "Ok",
            onPress: () => {
              onSuccess();
            },
          },
        ]);
      }
    } catch (e) {
      console.log(e);
      Alert.alert("Error", "Could not save medication reminder.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="w-full">
      <Card className="w-full rounded-2xl max-w-sm">
        <CardHeader>
          <CardTitle> Add new medication </CardTitle>
        </CardHeader>
        <CardContent>
          <View className="w-full flex-col gap-6">
            {/* Medication name */}
            <Input
              placeholder="Enter medication name"
              value={formData?.medicationName}
              onChangeText={(value) =>
                onHandleInputChange("medicationName", value)
              }
            />

            {/* Medication type */}
            <Select
              value={
                formData.medicationType
                  ? {
                      label: formData.medicationType,
                      value: formData.medicationType,
                    }
                  : undefined
              }
              onValueChange={(option) =>
                onHandleInputChange("medicationType", option?.value)
              }
            >
              <SelectTrigger>
                <SelectValue
                  className="text-foreground text-sm native:text-lg"
                  placeholder="Select a medication type"
                />
              </SelectTrigger>
              <SelectContent
                insets={contentInsets}
                style={{ width: triggerWidth }}
              >
                <SelectGroup>
                  {/* Render SelectItem dynamically from the list */}
                  {TypeList.map((item, index) => (
                    <SelectItem key={index} label={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* When to take */}
            <Select
              defaultValue={
                formData.whenToTake
                  ? { label: formData.whenToTake, value: formData.whenToTake }
                  : undefined
              }
              onValueChange={(option) =>
                onHandleInputChange("whenToTake", option?.value)
              }
            >
              <SelectTrigger
                className="w-full"
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  setTriggerWidth(width);
                }}
              >
                <SelectValue
                  className="text-foreground text-sm native:text-lg"
                  placeholder="When to take"
                />
              </SelectTrigger>
              <SelectContent
                insets={contentInsets}
                style={{ width: triggerWidth }}
              >
                <SelectGroup>
                  {/* Render SelectItem dynamically from the list */}
                  {WhenToTakeList.map((item, index) => (
                    <SelectItem key={index} label={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Frequency / Interval */}
            <Select
              value={
                formData.intakeInterval
                  ? {
                      label: formData.intakeInterval,
                      value: formData.intakeInterval,
                    }
                  : undefined
              }
              onValueChange={(option) =>
                onHandleInputChange("intakeInterval", option?.value)
              }
            >
              <SelectTrigger
                className="w-full"
                onLayout={(e) => {
                  const { width } = e.nativeEvent.layout;
                  setTriggerWidth(width);
                }}
              >
                <SelectValue
                  className="text-foreground text-sm native:text-lg"
                  placeholder="Select frequency/interval"
                />
              </SelectTrigger>
              <SelectContent
                insets={contentInsets}
                style={{ width: triggerWidth }}
              >
                <SelectGroup>
                  {intervalToTakeList.map((item, index) => (
                    <SelectItem key={index} label={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Conditionally show fields based on interval */}
            {formData.intakeInterval === "Specific days weekly" && (
              <View>
                <Text className="font-semibold">
                  Select weekly days (tap to toggle):
                </Text>
                <View className="flex-row flex-wrap mt-2">
                  {dayLabels.map((label, idx) => {
                    const selected = formData.specificDaysOfWeek.includes(idx);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={{
                          marginRight: 8,
                          marginBottom: 8,
                          padding: 8,
                          borderWidth: 1,
                          borderColor: selected ? "green" : "gray",
                          borderRadius: 4,
                        }}
                        onPress={() => toggleDaySelection(idx)}
                      >
                        <Text
                          style={{
                            color: selected ? "green" : "black",
                          }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {["every X days", "every X weeks", "every X months"].includes(
              formData.intakeInterval
            ) && (
              <View>
                <Text className="font-semibold">
                  Enter X (number of days/weeks/months):
                </Text>
                <Input
                  keyboardType="numeric"
                  value={formData.customIntervalValue?.toString()}
                  onChangeText={(val) =>
                    onHandleInputChange("customIntervalValue", val)
                  }
                />
              </View>
            )}

            {/* Start Date Picker */}
            <Text>Start Date</Text>
            <Pressable onPress={() => setShowStartDatePicker(true)}>
              <Text>
                {formData?.startDate?.toDateString() || "Select start date"}
              </Text>
            </Pressable>

            <DatePicker
              modal
              open={showStartDatePicker}
              date={formData?.startDate ?? new Date()}
              mode="date"
              onConfirm={(selectedDate) => {
                setShowStartDatePicker(false);
                onHandleInputChange("startDate", selectedDate);
              }}
              onCancel={() => setShowStartDatePicker(false)}
            />

            {/* End Date Picker */}
            <Text>End Date</Text>
            <Pressable onPress={() => setShowEndDatePicker(true)}>
              <Text>
                {formData?.endDate?.toDateString() || "Select end date"}
              </Text>
            </Pressable>

            <DatePicker
              modal
              open={showEndDatePicker}
              date={formData?.endDate ?? new Date()}
              mode="date"
              onConfirm={(selectedDate) => {
                setShowEndDatePicker(false);
                onHandleInputChange("endDate", selectedDate);
              }}
              onCancel={() => setShowEndDatePicker(false)}
            />

            {/* Reminder Time Picker */}
            <Text>Reminder Time</Text>
            <Pressable onPress={() => setShowTimePicker(true)}>
              <Text>{formData?.reminderTime || "Select time"}</Text>
            </Pressable>

            <DatePicker
              modal
              open={showTimePicker}
              date={
                formData?.reminderTime
                  ? timeStringToDate(formData.reminderTime)
                  : new Date()
              }
              mode="time"
              onConfirm={(selectedDate) => {
                setShowTimePicker(false);
                const timeOnly = formatTime(selectedDate);
                onHandleInputChange("reminderTime", timeOnly);
              }}
              onCancel={() => setShowTimePicker(false)}
            />

            <Button
              className="max-w-sm"
              onPress={() => saveMedicationReminder()}
            >
              {loading ? (
                <ActivityIndicator
                  size={"small"}
                  color={"white"}
                ></ActivityIndicator>
              ) : (
                <Text>Save medication reminder</Text>
              )}
            </Button>
          </View>
        </CardContent>
      </Card>
    </View>
  );
};

export default AddMedicationForm;
