import React, { useEffect, useState } from "react";
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
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

type PurchaseOfferings = any;

const SubscriptionPlans = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Offerings and subscription needs further setup and testing to fully work
  const [offerings, setOfferings] = useState<PurchaseOfferings | null>(null);

  useEffect(() => {
    getOfferings();
  }, []);

  async function getOfferings() {
    const offerings = await Purchases.getOfferings();
    if (
      offerings.current !== null &&
      offerings.current.availablePackages.length !== 0
    ) {
      setOfferings(offerings);
      // Set selected plan to the first available offering
      if (offerings.current.availablePackages.length > 0) {
        setSelectedPlan(offerings.current.availablePackages[0].identifier);
      }
    } else {
      console.error("No current offerings available");
    }
  }

  // Loading states
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleSubscribe = async (pkg: any) => {
    if (isPurchasing) return;
    setIsPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      if (
        customerInfo.entitlements.active &&
        Object.keys(customerInfo.entitlements.active).length > 0
      ) {
        router.push("/(app)/subscription/subscriptionSuccess");
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error("Purchase error:", e);
      }
    }
    setIsPurchasing(false);
  };

  const handleRestorePurchases = async () => {
    if (isRestoring || isPurchasing) return;
    setIsRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      if (
        customerInfo.entitlements?.active &&
        Object.keys(customerInfo.entitlements.active).length > 0
      ) {
        router.push("/(app)/subscription/subscriptionSuccess");
      }
    } catch (e: any) {
      console.error("Restore purchases error:", e);
    }
    setIsRestoring(false);
  };

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
            {offerings?.current?.availablePackages.map((pkg: any) => {
              const isSelected = selectedPlan === pkg.identifier;
              // You may want to format price and description as needed
              const product = pkg.product;
              return (
                <TouchableOpacity
                  key={pkg.identifier}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPlan(pkg.identifier)}
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
                          <Text>{product.title}</Text>
                        </CardTitle>
                        {/* If you have discount info in product or pkg, show it here */}
                        {product.introPrice && (
                          <Text className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                            {product.introPrice}
                          </Text>
                        )}
                      </View>
                      <Text className="text-xl font-bold mb-1">
                        {product.priceString}
                      </Text>
                      <Text className="text-muted-foreground mb-1">
                        {product.description}
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
        <Button
          variant="default"
          className="w-full"
          disabled={isPurchasing || !selectedPlan}
          onPress={() => {
            const selectedPkg = offerings?.current?.availablePackages.find(
              (p: any) => p.identifier === selectedPlan
            );
            if (selectedPkg) {
              handleSubscribe(selectedPkg);
            } else {
              console.error(
                "Couldn't find package for selected plan identifier:",
                selectedPlan
              );
            }
          }}
        >
          {isPurchasing ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#fff" />
              <Text>Subscribing...</Text>
            </View>
          ) : (
            <Text>
              Subscribe to{" "}
              {offerings?.current?.availablePackages.find(
                (pkg: any) => pkg.identifier === selectedPlan
              )?.product?.title || "a plan"}
            </Text>
          )}
        </Button>
        <View className="items-center mt-4">
          <Button
            variant="link"
            disabled={isRestoring || isPurchasing}
            onPress={handleRestorePurchases}
          >
            {isRestoring ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator />
                <Text>Restoring...</Text>
              </View>
            ) : (
              <Text>Restore Purchases</Text>
            )}
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SubscriptionPlans;
