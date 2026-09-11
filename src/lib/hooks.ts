import React, { useState, useEffect, useRef } from 'react';

// Common helper for form persistence
export function useFormPersistence<T>(key: string, initialState: T) {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse draft', e);
      }
    }
    return initialState;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState] as const;
}
