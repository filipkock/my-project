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
import MedicationDetailsCard from "~/components/custom/medicationDetails/MedicationDetailsCard";

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
          {medications.length === 0 ? (
            <Card className="w-full rounded-2xl">
              <CardHeader>
                <CardTitle>
                  No medications added. Get started and add one now!
                </CardTitle>
              </CardHeader>
            </Card>
          ) : (
            <View className="w-full flex-1 gap-4">
              {medications.map((med) => (
                <MedicationDetailsCard key={med.id} medication={med} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <View className="absolute bottom-10 right-10">
        <Button
          className="rounded-full h-14 w-14 items-center justify-center"
          onPress={() => router.push("/addNewMedication/step1")}
        >
          <Plus size={24} color="white" />
        </Button>
      </View>
    </SafeAreaView>
  );
};

export default Index;
