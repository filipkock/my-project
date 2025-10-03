import React, { useEffect, useState } from "react";
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
  Alert,
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
import { Badge } from "~/components/ui/badge";

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
      const hasActiveEntitlement = !!(
        customerInfo.entitlements?.active &&
        Object.keys(customerInfo.entitlements.active).length > 0
      );

      if (hasActiveEntitlement) {
        router.push("/(app)/subscription/subscriptionSuccess");
      } else {
        Alert.alert(
          "No purchases found",
          "We couldn't find any previous purchases to restore.\n\nMake sure you're signed in with the same Apple ID you used for the purchase, then try again.",
          [
            { text: "OK" },
            {
              text: "Manage Subscriptions",
              onPress: () =>
                Linking.openURL(
                  "itms-apps://apps.apple.com/account/subscriptions"
                ),
            },
          ]
        );
      }
    } catch (e: any) {
      console.error("Restore purchases error:", e);
      Alert.alert(
        "Restore failed",
        "Something went wrong while restoring purchases. Please try again in a moment."
      );
    }
    setIsRestoring(false);
  };

  // Helper function to get marketing-friendly plan names
  const getFriendlyPlanName = (identifier: string) => {
    switch (identifier) {
      case "poka_premium_monthly":
      case "$rc_monthly":
        return "Monthly";
      case "poka_premium_yearly":
      case "$rc_annual":
        return "Yearly";
      default:
        return identifier;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-secondary/40">
      <ScrollView className="flex-1 w-full p-6">
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
            <Text className="text-base">Unlock all Poka card decks</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <HeartIcon size={20} color="#000" />
            <Text className="text-base">Get priority support</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <SparklesIcon size={20} color="#000" />
            <Text className="text-base">
              Early access to new cards & features
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            <XMarkIcon size={20} color="#000" />
            <Text className="text-base">Cancel your subscription anytime</Text>
          </View>
        </View>
        <View className="gap-6 px-4">
          {/* Premium Plan Options as Selectable Cards */}
          <View className="gap-4">
            {offerings?.current?.availablePackages.map((pkg: any) => {
              const isSelected = selectedPlan === pkg.identifier;
              // You may want to format price and description as needed
              const product = pkg.product;
              // Determine if yearly or monthly
              const isYearly =
                pkg.identifier === "poka_premium_yearly" ||
                pkg.identifier === "$rc_annual";
              const isMonthly =
                pkg.identifier === "poka_premium_monthly" ||
                pkg.identifier === "$rc_monthly";
              // Title text: "Yearly" or "Monthly"
              const titleText = isYearly
                ? "Yearly "
                : isMonthly
                ? "Monthly "
                : pkg.identifier;
              // Description text
              const descriptionText = isYearly
                ? "Try 7 days free"
                : isMonthly
                ? "Try 3 days free"
                : product.description;
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
                    <View className="absolute top-3 right-5 z-10">
                      {isYearly && (
                        <Badge>
                          <Text>Most Popular</Text>
                        </Badge>
                      )}
                    </View>
                    <CardContent className="p-5 gap-2">
                      <View className="flex-row items-center justify-between mb-1">
                        <CardTitle
                          className={`text-lg ${
                            isSelected ? "text-primary" : ""
                          }`}
                        >
                          <View className="flex-row items-center">
                            <Text>{titleText}</Text>
                            {isYearly && (
                              <Text className="ml-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                Save 20%
                              </Text>
                            )}
                          </View>
                        </CardTitle>
                      </View>
                      <Text className="text-xl font-bold mb-1">
                        {product.priceString}
                        {(isYearly || isMonthly) && (
                          <Text className="text-sm text-muted-foreground ml-1">
                            {isYearly ? "/ year" : isMonthly ? "/ month" : ""}
                          </Text>
                        )}
                      </Text>
                      <Text className="text-muted-foreground mb-1">
                        {descriptionText}
                      </Text>
                    </CardContent>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
              {getFriendlyPlanName(
                offerings?.current?.availablePackages.find(
                  (pkg: any) => pkg.identifier === selectedPlan
                )?.identifier || ""
              )}
            </Text>
          )}
        </Button>
        <View className="items-center mt-4">
          <Button
            variant="link"
            disabled={isRestoring || isPurchasing}
            onPress={handleRestorePurchases}
            size="sm"
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
