import React, { useEffect, useState } from 'react';

interface BpmIndicatorProps {
  bpm: number;
  className?: string;
}

const BpmIndicator: React.FC<BpmIndicatorProps> = ({ bpm, className = '' }) => {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (bpm <= 0) return;

    const interval = 60000 / bpm; // milliseconds per beat
    let timeoutId: number;

    const pulse = () => {
      setIsActive(true);
      const flashDuration = 50
      timeoutId = setTimeout(() => {
        setIsActive(false);
        timeoutId = setTimeout(pulse, interval - flashDuration);
      }, flashDuration);
    };

    pulse();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [bpm]);

  if (bpm <= 0) return null;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div
        className={`w-3 h-3 rounded-full ${
          isActive ? 'bg-blue-500' : 'bg-gray-300'
        }`}
      />
      <span className="text-sm text-gray-600">テンポ: {bpm} BPM</span>
    </div>
  );
};

export default BpmIndicator;