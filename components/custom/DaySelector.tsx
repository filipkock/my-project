import React from "react";
import { View, TouchableOpacity } from "react-native";
import { Label } from "../ui/label";
import { Text } from "../ui/text";

interface DaySelectorProps {
  selectedDays: number[];
  onToggleDay: (index: number) => void;
  label?: string;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const DaySelector: React.FC<DaySelectorProps> = ({
  selectedDays,
  onToggleDay,
  label = "Select weekly days (tap):",
}) => {
  return (
    <View>
      <Label>{label}</Label>
      <View className="flex-row flex-wrap mt-2">
        {dayLabels.map((lbl, i) => {
          const sel = selectedDays.includes(i);
          return (
            <TouchableOpacity
              key={i}
              style={{
                marginRight: 8,
                marginBottom: 8,
                padding: 8,
                borderWidth: 1,
                backgroundColor: sel ? "black" : "none",
                borderRadius: 100,
              }}
              onPress={() => onToggleDay(i)}
            >
              <Text style={{ color: sel ? "white" : "black" }}>{lbl}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
