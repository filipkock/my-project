import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsContextType = {
  soundEnabled: boolean;
  toggleSound: () => void;
};

const SettingsContext = createContext<SettingsContextType>({
  soundEnabled: true,
  toggleSound: () => {},
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem("soundEnabled");
      if (stored !== null) setSoundEnabled(stored === "true");
    })();
  }, []);

  const toggleSound = async () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    await AsyncStorage.setItem("soundEnabled", newValue.toString());
  };

  return (
    <SettingsContext.Provider value={{ soundEnabled, toggleSound }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
