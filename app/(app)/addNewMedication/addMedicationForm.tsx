import React from "react";
import { View, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { Input } from "~/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "~/components/ui/card";
import {
  TypeList,
  WhenToTakeList,
  intervalToTakeList,
  dayLabels,
} from "~/constants/addMedicationOptions";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import {} from "react-native";
import { getFromStorage } from "~/services/storage";
import {
  addDoc,
  collection,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "~/config/firebase";
import {
  generateReminderDates,
  formatTime,
  timeStringToDate,
} from "~/services/reminderSchedule";

const AddMedicationForm = () => {
  const insets = useSafeAreaInsets();
  const contentInsets = {
    top: insets.top,
    bottom: insets.bottom,
    left: 12,
    right: 12,
  };

  const [triggerWidth, setTriggerWidth] = React.useState<number>(0);
  const [loading, setLoading] = React.useState<Boolean>(false);

  // FORM STORING LOGIC
  // ------------------------------------------------
  interface FormData {
    medicationName: string | undefined;
    medicationType: string | undefined;
    whenToTake: string | undefined;
    intakeInterval: string;
    startDate: Date | undefined;
    endDate: Date | undefined;
    reminderTime: string | undefined;
    customIntervalValue?: string; // numeric string for "X"
    specificDaysOfWeek: number[]; // used for "Specific days weekly"
    reminderDates?: Date[];
  }

  const [formData, setFormData] = React.useState<FormData>({
    medicationName: "",
    medicationType: "",
    whenToTake: "",
    intakeInterval: "",
    startDate: new Date(),
    endDate: new Date(),
    reminderTime: formatTime(new Date()),
    customIntervalValue: "",
    specificDaysOfWeek: [],
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
  const saveMedicationReminder = async () => {
    // Basic validation
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
      // 1. Create Medication Document
      const userinfo = await getFromStorage("userDetails");

      // 2. Generate Reminder Dates
      const customInterval =
        parseInt(formData.customIntervalValue || "1", 10) || 1;
      const reminders = generateReminderDates(
        startDate,
        endDate,
        intakeInterval,
        {
          customIntervalValue: customInterval,
          specificDaysOfWeek: formData.specificDaysOfWeek,
        }
      );

      const medicationRef = await addDoc(collection(db, "medication"), {
        medicationName,
        medicationType,
        whenToTake,
        intakeInterval,
        customInterval,
        specificDaysOfWeek: formData.specificDaysOfWeek || [],
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate)),
        userEmail: userinfo?.email,
        createdAt: serverTimestamp(),
        uid: userinfo.uid,
        time: formData.reminderTime,
      });

      // 3. Save Each Reminder in a seperate collection
      const remindersCollectionRef = collection(db, "reminders");
      const reminderWrites = reminders.map((reminderDate) => {
        return addDoc(remindersCollectionRef, {
          date: reminderDate,
          time: formData.reminderTime,
          whenToTake: formData.whenToTake,
          status: "pending",
          medId: medicationRef.id,
          uid: userinfo.uid,
        });
      });

      await Promise.all(reminderWrites);

      // 4. Show Success Message & Navigate Back
      Alert.alert("Success!", "Medication reminder was created", [
        {
          text: "Ok",
          onPress: () => router.push("/(app)/(tabs)/(medications)"),
        },
      ]);
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
                        <Text style={{ color: selected ? "green" : "black" }}>
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

            {/* Start and end date */}
            <Text>Start and end date</Text>
            <View className="w-full flex-row justify-between">
              <RNDateTimePicker
                minimumDate={new Date()}
                onChange={(event, selectedDate) => {
                  onHandleInputChange("startDate", selectedDate);
                }}
                value={formData?.startDate ?? new Date()}
              ></RNDateTimePicker>
              <RNDateTimePicker
                minimumDate={formData?.startDate ?? new Date()}
                onChange={(event, selectedDate) => {
                  onHandleInputChange("endDate", selectedDate);
                }}
                value={formData?.endDate ?? new Date()}
              ></RNDateTimePicker>
            </View>

            {/* Set Reminder time */}
            <Text>Reminder time</Text>
            <RNDateTimePicker
              mode="time"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  const timeOnly = formatTime(selectedDate);
                  onHandleInputChange("reminderTime", timeOnly);
                }
              }}
              value={
                formData?.reminderTime
                  ? timeStringToDate(formData.reminderTime) // Convert time string to Date for picker
                  : new Date()
              }
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
