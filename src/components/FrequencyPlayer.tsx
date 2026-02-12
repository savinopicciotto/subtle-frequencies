/**
 * Frequency player component with controls
 */

import { useState } from 'react';
import { HEALING_FREQUENCIES } from '../utils/presets';

interface FrequencyPlayerProps {
  frequency: number;
  volume: number;
  isPlaying: boolean;
  onFrequencyChange: (freq: number) => void;
  onVolumeChange: (vol: number) => void;
  onPlayToggle: () => void;
}

export function FrequencyPlayer({
  frequency,
  volume,
  isPlaying,
  onFrequencyChange,
  onVolumeChange,
  onPlayToggle,
}: FrequencyPlayerProps) {
  const [inputValue, setInputValue] = useState(frequency.toString());

  // Logarithmic scaling for frequency slider (gives more precision in low range)
  const MIN_FREQ = 20;
  const MAX_FREQ = 20000;
  const freqToSlider = (freq: number) => {
    return (Math.log(freq / MIN_FREQ) / Math.log(MAX_FREQ / MIN_FREQ)) * 1000;
  };
  const sliderToFreq = (slider: number) => {
    return MIN_FREQ * Math.pow(MAX_FREQ / MIN_FREQ, slider / 1000);
  };

  const handleFrequencyInput = (value: string) => {
    setInputValue(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= MIN_FREQ && numValue <= MAX_FREQ) {
      onFrequencyChange(numValue);
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-2xl font-display text-center mb-4">Frequency Generator</h2>

      {/* Play/Stop Button */}
      <div className="flex justify-center">
        <button
          onClick={onPlayToggle}
          className={`${
            isPlaying ? 'btn-secondary' : 'btn-primary'
          } px-12 py-4 text-lg font-semibold`}
        >
          {isPlaying ? '⏸ Stop' : '▶ Play'}
        </button>
      </div>

      {/* Frequency Slider (Logarithmic Scale) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Frequency: {frequency.toFixed(1)} Hz
        </label>
        <input
          type="range"
          min="0"
          max="1000"
          step="0.1"
          value={freqToSlider(frequency)}
          onChange={(e) => onFrequencyChange(sliderToFreq(parseFloat(e.target.value)))}
          className="slider"
        />
        <div className="text-xs text-gray-500 text-center">
          Logarithmic scale - more precision in low frequencies
        </div>
      </div>

      {/* Numeric Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Precise Frequency</label>
        <input
          type="number"
          min="20"
          max="20000"
          value={inputValue}
          onChange={(e) => handleFrequencyInput(e.target.value)}
          onBlur={() => setInputValue(frequency.toString())}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
        />
      </div>

      {/* Volume Control */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Volume: {Math.round(volume * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
          className="slider"
        />
      </div>

      {/* Preset Frequency Buttons */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Healing Frequencies</label>
        <div className="grid grid-cols-2 gap-2">
          {HEALING_FREQUENCIES.map((preset) => (
            <button
              key={preset.hz}
              onClick={() => onFrequencyChange(preset.hz)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                Math.abs(frequency - preset.hz) < 1
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <div className="font-semibold">{preset.hz} Hz</div>
              <div className="text-xs opacity-75">{preset.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
