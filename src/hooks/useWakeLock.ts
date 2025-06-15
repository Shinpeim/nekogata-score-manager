import { useEffect, useRef, useState } from 'react';

export const useWakeLock = () => {
  const [isActive, setIsActive] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    // Check if Wake Lock API is supported
    setIsSupported('wakeLock' in navigator && navigator.wakeLock !== undefined);
  }, []);

  const requestWakeLock = async () => {
    if (!isSupported || !navigator.wakeLock) return;

    try {
      wakeLockRef.current = await navigator.wakeLock.request('screen');
      setIsActive(true);

      // Listen for wake lock release
      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
      });
    } catch (error) {
      console.error('Failed to request wake lock:', error);
      setIsActive(false);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setIsActive(false);
      } catch (error) {
        console.error('Failed to release wake lock:', error);
      }
    }
  };

  const toggleWakeLock = async () => {
    if (isActive) {
      await releaseWakeLock();
    } else {
      await requestWakeLock();
    }
  };

  // Auto-reacquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wakeLockRef.current) {
        wakeLockRef.current.release();
      }
    };
  }, []);

  return {
    isActive,
    isSupported,
    requestWakeLock,
    releaseWakeLock,
    toggleWakeLock
  };
};