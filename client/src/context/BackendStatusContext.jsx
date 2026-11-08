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
      // Allow up to 45 seconds for cloud cold-start wakeups (Render free tier)
      const controller = new AbortController();
      const timeoutMs = isReady ? 15000 : 45000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
      // Network failure, timeout, or server cold start in progress
      setIsReady(false);
    } finally {
      isCheckingRef.current = false;
    }
  }, [isReady]);

  useEffect(() => {
    // Initial probe on application entry
    checkReadiness();

    // Schedule periodic polling:
    // If not ready: retry 5s after attempt completes so container wakeup is caught quickly.
    // Once ready: check at lower frequency (every 30 seconds).
    const scheduleNext = () => {
      const delay = isReady ? 30000 : 5000;
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
