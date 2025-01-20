import AsyncStorage from "@react-native-async-storage/async-storage";

// Save data to local storage
export const setLocalStorage = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to storage:", error);
  }
};

// Get data from local storage
export const getFromStorage = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Error reading from storage:", error);
    return null;
  }
};

// Remove data from local storage
export const removeFromStorage = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from storage:", error);
  }
};

// Clear all data from local storage
export const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.error("Error clearing storage:", error);
  }
};
