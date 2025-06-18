import React from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";

const toastConfig = {
  plain: ({ text1, text2 }: any) => (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 8,
        padding: 12,
        minWidth: 200,
        alignSelf: "center",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
      }}
    >
      {text1 ? (
        <Text
          style={{
            color: "#222",
            fontWeight: "600",
            fontSize: 15,
            textAlign: "center",
          }}
        >
          {text1}
        </Text>
      ) : null}
      {text2 ? (
        <Text
          style={{
            color: "#444",
            fontSize: 13,
            marginTop: 2,
            textAlign: "center",
          }}
        >
          {text2}
        </Text>
      ) : null}
    </View>
  ),
};

export default toastConfig;
