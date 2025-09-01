import React, { useEffect, useState } from "react";
import { View, SafeAreaView, TouchableOpacity } from "react-native";
import { Text } from "~/components/ui/text";
import { Card, CardContent, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { router } from "expo-router";
import {
  XMarkIcon,
  CheckCircleIcon,
  StarIcon,
  SparklesIcon,
  HeartIcon,
} from "react-native-heroicons/solid";
import Purchases from "react-native-purchases";

const plans = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$4.99/month",
    description: "Billed monthly, cancel anytime.",
    discount: null,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$39.99/year",
    description: "Best value! Save 33% vs monthly.",
    discount: "Save 33%",
  },
];

type PurchaseOfferings = any;

const SubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  // Offerings and subscription needs further setup and testing to fully work
  const [offerings, setOfferings] = useState<PurchaseOfferings | null>(null);

  useEffect(() => {
    getOfferings();
  }, []);

  async function getOfferings() {
    console.log("gettings offerings");
    const offerings = await Purchases.getOfferings();
    if (
      offerings.current !== null &&
      offerings.current.availablePackages.length !== 0
    ) {
      console.log("Current offerings:", offerings);
      setOfferings(offerings);
    } else {
      console.error("No current offerings available");
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <View className="flex-1 w-full p-6 ">
        <XMarkIcon size={28} color="#222" onPress={() => router.back()} />
        <Text className="text-3xl font-bold px-6 pt-8 pb-6">
          Unlock Pokas Full Potential
        </Text>
        {/* Premium features list (centered, black icons) */}
        <View className="flex-col gap-3 px-6 pb-12">
          <View className="flex-row items-center gap-2">
            <CheckCircleIcon size={20} color="#000" />
            <Text className="text-base">Add unlimited medications</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <StarIcon size={20} color="#000" />
            <Text className="text-base">Unlock every Poka card</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <HeartIcon size={20} color="#000" />
            <Text className="text-base">
              Priority support — you’re first in line
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SparklesIcon size={20} color="#000" />
            <Text className="text-base">Early access to new features</Text>
          </View>
        </View>
        <View className="gap-6 px-4">
          {/* Premium Plan Options as Selectable Cards */}
          <View className="gap-4">
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              return (
                <TouchableOpacity
                  key={plan.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPlan(plan.id)}
                  style={{ borderRadius: 24 }}
                >
                  <Card
                    className={`border-2 ${
                      isSelected ? "border-primary" : "border-gray-200"
                    }`}
                  >
                    <CardContent className="p-5 gap-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <CardTitle
                          className={`text-lg ${
                            isSelected ? "text-primary" : ""
                          }`}
                        >
                          <Text>{plan.label}</Text>
                        </CardTitle>
                        {plan.discount && (
                          <Text className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {plan.discount}
                          </Text>
                        )}
                      </View>
                      <Text className="text-xl font-bold mb-1">
                        {plan.price}
                      </Text>
                      <Text className="text-muted-foreground mb-1">
                        {plan.description}
                      </Text>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
      {/* Subscribe button at the bottom */}
      <View className="px-6 pb-6 pt-2 bg-secondary/40">
        <Button variant="default" className="w-full">
          <Text>
            Subscribe to {plans.find((p) => p.id === selectedPlan)?.label}
          </Text>
        </Button>
        <Text className="text-md mt-4 text-muted-foreground text-center">
          Cancel anytime{" "}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default SubscriptionPlans;
