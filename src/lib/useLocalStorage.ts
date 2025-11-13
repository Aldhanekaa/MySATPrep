"use client";
import { useState } from "react";

/**
 * Custom hook for managing localStorage with React state
 * @param key - The localStorage key
 * @param initialValue - The initial value if no value is found in localStorage
 * @returns [value, setValue] - The current value and a setter function
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [
  T,
  (value: T | ((val: T) => T)) => void,
  (value: T | ((val: T) => T)) => void
] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      // Get from local storage by key
      const item = localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });

  // Being repeatedly used in components that is being shown multiple times in a page makes this operation overlaps and causes innacurate updates.
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Save to local storage
      if (typeof window !== "undefined") {
        try {
          const serializedValue = JSON.stringify(valueToStore);
          // in order to fix the overlapping issue, we have

          localStorage.setItem(key, serializedValue);
          console.log(`✅ Successfully saved to localStorage: ${key}`);
        } catch (storageError) {
          if (
            storageError instanceof DOMException &&
            storageError.name === "QuotaExceededError"
          ) {
            console.error(`❌ localStorage quota exceeded for key: ${key}`);
          } else {
            console.error(
              `❌ Failed to serialize/save to localStorage for key: ${key}`,
              storageError
            );
          }
          // Don't update state if localStorage save failed
          return;
        }
      } else {
        console.warn("⚠️ Cannot save to localStorage: running on server-side");
        // Still update state even if we can't persist
      }

      // Save state only after successful localStorage save (or on server-side)
      setStoredValue(valueToStore);
    } catch (error) {
      console.error(`❌ Unexpected error in setValue for key: ${key}`, error);
    }
  };

  // this function will only updates and merge values given in the parameter to the correspondinng item inside the current localStorage, and thus preventing overlapping updates between components
  const updateValue = <T>(value: T | ((val: T) => T)) => {
    // Get from local storage by key
    const currentLocalStorageData = localStorage.getItem(key);

    if (currentLocalStorageData) {
      try {
        const parsedData = JSON.parse(currentLocalStorageData);
        const newValue = value instanceof Function ? value(parsedData) : value;

        // Merge the new value with the existing data
        const updatedData = { ...parsedData, ...newValue };

        // Save the updated data back to local storage
        localStorage.setItem(key, JSON.stringify(updatedData));
        setStoredValue(updatedData);
      } catch (error) {
        console.error(
          `❌ Failed to update localStorage for key: ${key}`,
          error
        );
      }
    }
  };

  return [storedValue, setValue, updateValue];
}
