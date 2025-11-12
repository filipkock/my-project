import LottieView from "lottie-react-native";
import { User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import React from "react";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Text } from "~/components/ui/text";
import { db } from "~/config/firebase";
import { getFromStorage } from "~/src/services/storage";
import MedicationDetailsCard from "~/components/custom/medicationDetails/MedicationDetailsCard";
import { Timestamp } from "firebase/firestore";
import { FirestoreMedication } from "~/src/types/medication";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [medications, setMedications] = useState<FirestoreMedication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMedicationsForUser();
  }, []);

  /** 🔹 Fetch all medications for the logged-in user */
  const getMedicationsForUser = async () => {
    const user = await getFromStorage("userDetails");
    if (!user?.uid) return;
    setUser(user);

    setLoading(true);
    try {
      const medicationQuery = query(
        collection(db, "medication"),
        where("uid", "==", user.uid)
      );
      const snapshot = await getDocs(medicationQuery);

      const medicationsArray: FirestoreMedication[] = snapshot.docs.map(
        (doc) => ({
          id: doc.id,
          ...doc.data(),
        })
      ) as FirestoreMedication[];

      setMedications(medicationsArray);
    } catch (error) {
      console.error("Error fetching medications:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <LottieView
          source={require("~/assets/animations/loading.json")}
          style={{ width: 250, height: 250 }}
          autoPlay
          loop
        />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <ScrollView>
        <View className="flex-1 w-full p-10 gap-5">
          <Text className="text-xl font-bold mb-1">Medications</Text>
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
      <View className="absolute bottom-10 right-10"></View>
    </SafeAreaView>
  );
};

export default Index;
