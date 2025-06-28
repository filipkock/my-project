import React from "react";
import { View } from "react-native";

type StepperProps = {
  totalSteps: number;
  currentStep: number; // 1-based index
};

export function Stepper({ totalSteps, currentStep }: StepperProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        marginVertical: 16,
      }}
    >
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <View
          key={idx}
          style={{
            width: 12,
            height: 12,
            borderRadius: 6,
            marginHorizontal: 6,
            backgroundColor:
              idx + 1 <= currentStep
                ? "#000000" // black for current and previous
                : "#CCCCD8", // light gray for future
          }}
        />
      ))}
    </View>
  );
}
