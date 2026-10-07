import { useEffect, useState } from 'react';
 
// Works like useState, but the value is saved to localStorage and restored on reload.
export default function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) return JSON.parse(raw);
    } catch (e) {
      // corrupted or blocked storage: fall back to the initial value
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });
 
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      // storage full or unavailable: ignore
    }
  }, [key, value]);
 
  return [value, setValue];
}