import React from "react";
import { View, Alert, SafeAreaView } from "react-native";
import { Text } from "~/components/ui/text";
import { useAuth } from "~/src/context/auth";
import { Button } from "~/components/ui/button";
import { clearStorage } from "~/services/storage";

const Settings = () => {
  const { signOut } = useAuth(); // Access the signOut function from AuthProvider

  const handleLogout = async () => {
    try {
      await signOut(); // Trigger the Firebase Auth sign-out
      clearStorage();
      Alert.alert("Logged Out", "You have been logged out successfully.");
    } catch (error: any) {
      Alert.alert("Logout Error", error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/30 p-8">
      <View className="flex-1 w-full p-10">
        <Text className="text-xl mb-5">Settings</Text>
        <Button variant={"default"} className="w-full" onPress={handleLogout}>
          <Text>Logout</Text>
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default Settings;
