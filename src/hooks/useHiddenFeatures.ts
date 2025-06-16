import { useState, useEffect } from 'react';

interface HiddenFeatures {
  syncSettings: boolean;
}

export const useHiddenFeatures = (): HiddenFeatures => {
  const [features, setFeatures] = useState<HiddenFeatures>({
    syncSettings: false,
  });

  useEffect(() => {
    const checkFeatures = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const localStorage = window.localStorage;

      const newFeatures: HiddenFeatures = {
        syncSettings: 
          urlParams.has('sync') || 
          urlParams.get('debug') === 'sync' ||
          localStorage.getItem('nekogata-debug-sync') === 'true',
      };

      setFeatures(newFeatures);
    };

    checkFeatures();
    
    window.addEventListener('popstate', checkFeatures);
    return () => window.removeEventListener('popstate', checkFeatures);
  }, []);

  return features;
};