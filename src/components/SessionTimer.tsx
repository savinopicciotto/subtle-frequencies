/**
 * Session timer component with countdown
 */

import { useState, useEffect, useCallback } from 'react';

interface SessionTimerProps {
  isPlaying: boolean;
  onTimerEnd: () => void;
}

const TIMER_PRESETS = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
  { label: '20 min', minutes: 20 },
  { label: '30 min', minutes: 30 },
  { label: '60 min', minutes: 60 },
  { label: '∞', minutes: 0 },
];

export function SessionTimer({ isPlaying, onTimerEnd }: SessionTimerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(15);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startTimer = useCallback(() => {
    if (selectedMinutes === 0) {
      setIsActive(false);
      return;
    }
    setRemainingSeconds(selectedMinutes * 60);
    setIsActive(true);
  }, [selectedMinutes]);

  const resetTimer = () => {
    setIsActive(false);
    setRemainingSeconds(0);
  };

  // Start timer when playing starts
  useEffect(() => {
    if (isPlaying && remainingSeconds === 0 && selectedMinutes > 0) {
      startTimer();
    } else if (!isPlaying) {
      resetTimer();
    }
  }, [isPlaying, selectedMinutes, remainingSeconds, startTimer]);

  // Countdown logic
  useEffect(() => {
    if (!isActive || !isPlaying || remainingSeconds <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsActive(false);
          onTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPlaying, remainingSeconds, onTimerEnd]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-2xl font-display">Session Timer</h2>

      {/* Timer Display */}
      {isActive && remainingSeconds > 0 && (
        <div className="text-center">
          <div className="text-5xl font-display text-accent-gold">
            {formatTime(remainingSeconds)}
          </div>
          <div className="text-sm text-gray-400 mt-2">Time Remaining</div>
        </div>
      )}

      {/* Duration Selector */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Duration</label>
        <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
          {TIMER_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                setSelectedMinutes(preset.minutes);
                if (isPlaying) {
                  setRemainingSeconds(preset.minutes * 60);
                  setIsActive(preset.minutes > 0);
                }
              }}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedMinutes === preset.minutes
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {selectedMinutes === 0 && (
        <div className="text-sm text-gray-400 text-center">
          Infinite session - play until manually stopped
        </div>
      )}
    </div>
  );
}
