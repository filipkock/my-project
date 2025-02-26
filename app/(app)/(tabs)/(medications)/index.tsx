import { router } from "expo-router";
import { User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React from "react";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { db } from "~/config/firebase";
import { Plus } from "~/lib/icons/plus";
import { getFromStorage } from "~/src/services/storage";

interface Medication {
  id: string;
  medicationName: string;
  medicationType: string;
  intakeInterval: string;
  time: string;
  whenToTake: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);

  useEffect(() => {
    getMedicationsForUser();
  }, []);

  /** 🔹 Fetch all medications for the logged-in user */
  const getMedicationsForUser = async () => {
    const user = await getFromStorage("userDetails");
    if (!user?.uid) return;
    setUser(user);

    try {
      const medicationQuery = query(
        collection(db, "medication"),
        where("uid", "==", user.uid)
      );
      const snapshot = await getDocs(medicationQuery);

      const medicationsArray: Medication[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Medication[];

      setMedications(medicationsArray);
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/30">
      <ScrollView>
        <View className="flex-1 w-full p-10 gap-5">
          {/* Create new medication section */}
          <Card className="w-full rounded-2xl">
            <CardHeader>
              <CardTitle>Good morning {user?.displayName}</CardTitle>
            </CardHeader>
            <CardContent>
              <Text className="mb-4">
                Here you can get an overview of all you medications
              </Text>
              <Button
                variant={"default"}
                className="w-full flex flex-row gap-3"
                onPress={() => router.push("/addNewMedication/main")}
              >
                <Plus size={22} color="white" />
                <Text>Add medication</Text>
              </Button>
            </CardContent>
          </Card>

          {medications.length === 0 ? (
            <Card className="w-full rounded-2xl">
              <CardHeader>
                <CardTitle>
                  No medications added. Get started and add one now!
                </CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <View className="flex-1 gap-4">
              {medications.map((medication) => (
                <Card key={medication.id} className="w-full rounded-2xl">
                  <CardHeader>
                    <CardTitle>{medication.medicationName}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Text className="text-base mb-3">
                      Type: {medication.medicationType}
                    </Text>
                    <Text className="text-base mb-3">
                      Interval: {medication.intakeInterval}
                    </Text>
                    <Text className="text-base mb-3">
                      When to Take: {medication.whenToTake}
                    </Text>
                    <Text className="text-base mb-3">
                      Reminder Time: {medication.time}
                    </Text>
                  </CardContent>
                </Card>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Index;
