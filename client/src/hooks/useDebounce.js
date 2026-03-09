import { useEffect, useState, useRef } from 'react';

/**
 * Production-ready custom hook for debouncing values
 * 
 * Features:
 * - Prevents unnecessary API calls by delaying value updates
 * - Automatically cancels pending timers when value changes
 * - Handles edge cases (null, undefined, empty values)
 * - Optimized with useRef to prevent memory leaks
 * 
 * @param {any} value - The value to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} - The debounced value
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 * 
 * useEffect(() => {
 *   // This will only run after user stops typing for 500ms
 *   performSearch(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Clear any existing timeout to prevent multiple timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up the debounce timer
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
      timeoutRef.current = null;
    }, delay);

    // Cleanup: cancel the timer if value changes before delay completes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [value, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  return debouncedValue;
};
