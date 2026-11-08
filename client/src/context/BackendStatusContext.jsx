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

    // If not ready: retry 5s after attempt completes to detect container wakeup.
    // Once ready: STOP polling! Do NOT send continuous requests that prevent Render Free from sleeping.
    if (!isReady) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        checkReadiness();
      }, 5000);
    }

    // Pause all checks when user minimizes or switches tabs
    const handleVisibility = () => {
      if (document.hidden) {
        if (timerRef.current) clearTimeout(timerRef.current);
      } else if (!isReady) {
        checkReadiness();
      }
    };

    // React to API errors without needing continuous polling
    const handleServiceUnavailable = () => {
      setIsReady(false);
      checkReadiness();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('backend-unavailable', handleServiceUnavailable);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('backend-unavailable', handleServiceUnavailable);
    };
  }, [checkReadiness, isReady]);

  return (
    <BackendStatusContext.Provider value={{ isReady, checkNow: checkReadiness }}>
      {children}
    </BackendStatusContext.Provider>
  );
};

export const useBackendStatus = () => useContext(BackendStatusContext);
