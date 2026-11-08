import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';

const BackendStatusContext = createContext({
  isReady: false,
  checkNow: () => {},
});

export const BackendStatusProvider = ({ children }) => {
  // Initially false (red dot) while verifying availability
  const [isReady, setIsReady] = useState(false);
  const isCheckingRef = useRef(false);
  const timerRef = useRef(null);

  const checkReadiness = useCallback(async () => {
    // Prevent overlapping concurrent checks
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      // Abort after 6 seconds to prevent stalled requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await api.get('/health/ready', {
        signal: controller.signal,
        validateStatus: (status) => status < 600, // Handle 503 without throwing Axios error
      });
      clearTimeout(timeoutId);

      if (response.status === 200 && response.data?.status === 'READY') {
        setIsReady(true);
      } else {
        setIsReady(false);
      }
    } catch (_) {
      // Network failure, timeout, or server sleep
      setIsReady(false);
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial probe on application entry
    checkReadiness();

    // Schedule periodic polling:
    // If not ready: check every 10 seconds.
    // Once ready: check at lower frequency (every 45 seconds).
    const scheduleNext = () => {
      const delay = isReady ? 45000 : 10000;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        await checkReadiness();
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [checkReadiness, isReady]);

  return (
    <BackendStatusContext.Provider value={{ isReady, checkNow: checkReadiness }}>
      {children}
    </BackendStatusContext.Provider>
  );
};

export const useBackendStatus = () => useContext(BackendStatusContext);
