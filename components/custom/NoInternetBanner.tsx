import NetInfo from "@react-native-community/netinfo";
import { View, SafeAreaView } from "react-native";
import React, { useEffect, useState } from "react";
import { Text } from "~/components/ui/text";

export default function NetworkBanner() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  if (isConnected) return null;

  return (
    <View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FF3B30",
        zIndex: 999,
      }}
    >
      <SafeAreaView
        style={{
          paddingVertical: 10,
          paddingHorizontal: 16,
        }}
      >
        <Text
          style={{ color: "white", textAlign: "center", fontWeight: "600" }}
        >
          No Internet Connection, some features won’t work
        </Text>
      </SafeAreaView>
    </View>
  );
}
