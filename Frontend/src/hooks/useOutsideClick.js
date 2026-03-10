// hooks/useOutsideClick.js
import { useEffect, useRef } from 'react';

/**
 * Hook that detects clicks outside of the specified element
 * @param {Function} callback - Function to call when a click outside occurs
 * @returns {Object} ref - Attach this ref to the element you want to monitor
 */
const useOutsideClick = (callback) => {
  const ref = useRef();

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Make sure the ref is defined and the click is outside
      if (ref.current && !ref.current.contains(event.target)) {
        // Small delay to ensure we're not interfering with the click that might have opened the menu
        setTimeout(() => {
          callback();
        }, 10);
      }
    };

    // Add event listener with capture phase to ensure we get the event first
    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, [callback]);

  return ref;
};

export default useOutsideClick;