// app/providers/SubscriptionProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";
import Purchases from "react-native-purchases";

const LS_KEY = "subStatus";
const ENTITLEMENT_ID = "Poka premium";

type SubStatus = {
  active: boolean;
  productId?: string | null;
  expirationDate?: string | null;
  lastVerifiedAt?: string;
};

type Ctx = {
  status: SubStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const SubCtx = createContext<Ctx>({
  status: null,
  loading: true,
  refresh: async () => {},
});

async function fetchStatus(): Promise<SubStatus> {
  const info = await Purchases.getCustomerInfo();
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  return {
    active: !!ent,
    productId: ent?.productIdentifier ?? null,
    expirationDate: ent?.expirationDate ?? null,
    lastVerifiedAt: new Date().toISOString(),
  };
}

export function SubscriptionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<SubStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      const fresh = await fetchStatus();
      setStatus(fresh);
      await AsyncStorage.setItem(LS_KEY, JSON.stringify(fresh));
    } catch {}
  };

  useEffect(() => {
    (async () => {
      const cached = await AsyncStorage.getItem(LS_KEY);
      if (cached) setStatus(JSON.parse(cached));
      await refresh();
      setLoading(false);
    })();

    const sub = AppState.addEventListener("change", async (s) => {
      if (s === "active") await refresh();
    });

    const onCustomerInfoUpdate = async () => {
      await refresh();
    };
    Purchases.addCustomerInfoUpdateListener(onCustomerInfoUpdate);

    return () => {
      sub.remove();
      Purchases.removeCustomerInfoUpdateListener(onCustomerInfoUpdate);
    };
  }, []);

  return (
    <SubCtx.Provider value={{ status, loading, refresh }}>
      {children}
    </SubCtx.Provider>
  );
}

export const useSubscription = () => useContext(SubCtx);
