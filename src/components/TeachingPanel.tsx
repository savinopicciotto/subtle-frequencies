/**
 * Teaching Panel — large spectrometer + harmonic layer quick-mute toggles.
 * Designed for classroom/facilitation use: show students what they're hearing
 * without scrolling away from the visualizer.
 */

import { Spectrometer } from './Spectrometer';
import type { HarmonicEffect } from '../audio/harmonicEngine';
import type { TimbreType } from '../audio/timbres';

type HarmonicLayer = {
  ratio: number;
  beatFrequency: number;
  volume: number;
  effect: HarmonicEffect;
  label: string;
  muted: boolean;
  timbre: TimbreType | null;
};

interface TeachingPanelProps {
  isPlaying: boolean;
  frequency: number;
  harmonicLayers: HarmonicLayer[];
  harmonicsEnabled: boolean;
  onToggleLayerMute: (index: number) => void;
}

export function TeachingPanel({
  isPlaying,
  frequency,
  harmonicLayers,
  harmonicsEnabled,
  onToggleLayerMute,
}: TeachingPanelProps) {
  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-display">Teaching View</h2>
        <span className="text-xs text-gray-500">Live frequency analysis</span>
      </div>

      {/* Large spectrometer */}
      <Spectrometer isPlaying={isPlaying} frequency={frequency} forceExpanded />

      {/* Harmonic layer quick-mute toggles */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-300">Overtone Layers</h3>
          {!harmonicsEnabled && (
            <span className="text-xs text-gray-500">(harmonics off)</span>
          )}
        </div>

        {harmonicLayers.length === 0 ? (
          <p className="text-xs text-gray-500">
            Load a harmonic preset below to see layers here
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {harmonicLayers.map((layer, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onToggleLayerMute(index)}
                disabled={!harmonicsEnabled}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  !harmonicsEnabled
                    ? 'border-white/10 bg-white/5 text-gray-600 cursor-not-allowed'
                    : layer.muted
                    ? 'border-white/10 bg-white/5 text-gray-500 line-through'
                    : 'border-accent-gold/60 bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
