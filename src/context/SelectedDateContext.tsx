// context/SelectedDateContext.tsx
import { createContext, useContext, useState } from "react";

type SelectedDateContextType = {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};

const SelectedDateContext = createContext<SelectedDateContextType>({
  selectedDate: new Date().toISOString().split("T")[0],
  setSelectedDate: () => {},
});

import { PropsWithChildren } from "react";

export const SelectedDateProvider = ({ children }: PropsWithChildren<{}>) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  return (
    <SelectedDateContext.Provider value={{ selectedDate, setSelectedDate }}>
      {children}
    </SelectedDateContext.Provider>
  );
};

export const useSelectedDate = () => useContext(SelectedDateContext);
