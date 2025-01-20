import { View } from "react-native";
import React, { useState } from "react";
import { Text } from "~/components/ui/text";

export default function medicationList() {
  const [medList, setMedList] = useState<Array<any>>([]);

  return (
    <View>
      <Text>medicationList</Text>
    </View>
  );
}
