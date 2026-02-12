/**
 * Binaural beats control component
 */

import { BRAINWAVE_PRESETS } from '../audio/binauralEngine';
import type { BrainwaveState } from '../audio/binauralEngine';

interface BinauralBeatsProps {
  enabled: boolean;
  brainwaveState: BrainwaveState;
  beatHz: number;
  volume: number;
  onEnabledChange: (enabled: boolean) => void;
  onBrainwaveStateChange: (state: BrainwaveState) => void;
  onBeatHzChange: (hz: number) => void;
  onVolumeChange: (vol: number) => void;
}

const BRAINWAVE_INFO: Record<BrainwaveState, { label: string; range: string; description: string }> = {
  delta: { label: 'Delta', range: '0.5-4 Hz', description: 'Deep Sleep' },
  theta: { label: 'Theta', range: '4-8 Hz', description: 'Meditation / Creativity' },
  alpha: { label: 'Alpha', range: '8-14 Hz', description: 'Relaxation / Flow' },
  beta: { label: 'Beta', range: '14-30 Hz', description: 'Focus / Alertness' },
  gamma: { label: 'Gamma', range: '30-50 Hz', description: 'Peak Awareness' },
  custom: { label: 'Custom', range: 'Manual', description: 'Custom Frequency' },
};

export function BinauralBeats({
  enabled,
  brainwaveState,
  beatHz,
  volume,
  onEnabledChange,
  onBrainwaveStateChange,
  onBeatHzChange,
  onVolumeChange,
}: BinauralBeatsProps) {
  const handleBrainwaveChange = (state: BrainwaveState) => {
    onBrainwaveStateChange(state);
    if (state !== 'custom') {
      onBeatHzChange(BRAINWAVE_PRESETS[state]);
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display">Binaural Beats</h2>
        <button
          onClick={() => onEnabledChange(!enabled)}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            enabled
              ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
              : 'bg-white/10 border border-white/20'
          }`}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      <div className="text-sm text-gray-400 flex items-center gap-2">
        <span className="text-lg">🎧</span>
        <span>Use headphones for binaural beats</span>
      </div>

      {enabled && (
        <>
          {/* Brainwave State Presets */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Brainwave State</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(BRAINWAVE_INFO).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => handleBrainwaveChange(key as BrainwaveState)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    brainwaveState === key
                      ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                      : 'bg-white/5 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <div className="font-semibold">{info.label}</div>
                  <div className="text-xs opacity-75">{info.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Beat Frequency */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Beat Frequency: {beatHz.toFixed(1)} Hz
            </label>
            <input
              type="range"
              min="0.5"
              max="50"
              step="0.5"
              value={beatHz}
              onChange={(e) => {
                onBrainwaveStateChange('custom');
                onBeatHzChange(parseFloat(e.target.value));
              }}
              className="slider"
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
        </>
      )}
    </div>
  );
}
