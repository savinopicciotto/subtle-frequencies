/**
 * Harmonic layers control component
 * Pure-ratio (just intonation) harmonics with independent beat frequencies
 */

import { useState } from 'react';
import { HARMONIC_SERIES, type HarmonicEffect } from '../audio/harmonicEngine';
import { HARMONIC_PRESETS } from '../audio/harmonicPresets';

interface HarmonicLayer {
  ratio: number;
  beatFrequency: number;
  volume: number;
  effect: HarmonicEffect;
  label: string;
}

interface HarmonicLayersProps {
  enabled: boolean;
  layers: HarmonicLayer[];
  onEnabledChange: (enabled: boolean) => void;
  onAddLayer: (ratio: number, beatFreq: number, volume: number, effect: HarmonicEffect) => void;
  onRemoveLayer: (index: number) => void;
  onUpdateLayerBeat: (index: number, beatFreq: number) => void;
  onUpdateLayerVolume: (index: number, volume: number) => void;
  onLoadPreset: (layers: Array<{ ratio: number; beatFrequency: number; volume: number; effect: HarmonicEffect }>) => void;
}

export function HarmonicLayers({
  enabled,
  layers,
  onEnabledChange,
  onAddLayer,
  onRemoveLayer,
  onUpdateLayerBeat,
  onUpdateLayerVolume,
  onLoadPreset,
}: HarmonicLayersProps) {
  const [selectedRatio, setSelectedRatio] = useState(2); // Default: Octave
  const [newBeatFreq, setNewBeatFreq] = useState(2);
  const [newVolume, setNewVolume] = useState(0.3);
  const [selectedEffect, setSelectedEffect] = useState<HarmonicEffect>('none');
  const [showPresets, setShowPresets] = useState(false);

  const handleAddLayer = () => {
    onAddLayer(selectedRatio, newBeatFreq, newVolume, selectedEffect);
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display">Harmonic Layers</h2>
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

      <div className="text-sm text-gray-400">
        Pure-ratio harmonics (just intonation) with independent pulse frequencies and ear candy effects
      </div>

      {enabled && (
        <>
          {/* Presets */}
          <div className="space-y-3">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="w-full px-4 py-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-lg font-medium hover:from-purple-600/30 hover:to-blue-600/30 transition-all"
            >
              {showPresets ? '🎵 Hide Presets' : '🎵 Show Presets'}
            </button>

            {showPresets && (
              <div className="grid grid-cols-2 gap-2">
                {HARMONIC_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onLoadPreset(preset.layers)}
                    className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-accent-gold/50 rounded-lg text-left transition-all group"
                  >
                    <div className="font-semibold text-sm text-accent-gold group-hover:text-accent-amber">
                      {preset.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{preset.description}</div>
                    <div className="text-xs text-gray-600 mt-1">{preset.layers.length} layers</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add Layer Controls */}
          <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-sm font-semibold text-gray-300">Add Harmonic Layer</h3>

            {/* Harmonic Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Harmonic Ratio
              </label>
              <select
                value={selectedRatio}
                onChange={(e) => setSelectedRatio(parseFloat(e.target.value))}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
              >
                {HARMONIC_SERIES.map((h) => (
                  <option key={h.ratio} value={h.ratio}>
                    {h.ratio}x - {h.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Effect Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Ear Candy Effect
              </label>
              <select
                value={selectedEffect}
                onChange={(e) => setSelectedEffect(e.target.value as HarmonicEffect)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
              >
                <option value="none">None (Organic Breathing)</option>
                <option value="bend-up">Bend Up (Slow Rise)</option>
                <option value="bend-down">Bend Down (Slow Fall)</option>
                <option value="trickle">Trickle (Cascading Steps)</option>
                <option value="shake">Shake (Fast Shimmer)</option>
                <option value="buzz">Buzz (Amplitude Tremor)</option>
              </select>
            </div>

            {/* Beat Frequency */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Pulse Frequency: {newBeatFreq.toFixed(1)} Hz
              </label>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={newBeatFreq}
                onChange={(e) => setNewBeatFreq(parseFloat(e.target.value))}
                className="slider"
              />
              <div className="text-xs text-gray-500">
                0 Hz = steady tone, higher = faster pulsing
              </div>
            </div>

            {/* Volume */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Volume: {Math.round(newVolume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={newVolume}
                onChange={(e) => setNewVolume(parseFloat(e.target.value))}
                className="slider"
              />
            </div>

            <button
              onClick={handleAddLayer}
              className="btn-primary w-full text-sm"
            >
              + Add Layer
            </button>
          </div>

          {/* Active Layers */}
          {layers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">
                Active Layers ({layers.length})
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {layers.map((layer, index) => {
                  const harmonic = HARMONIC_SERIES.find((h) => h.ratio === layer.ratio);
                  return (
                    <div
                      key={index}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm">
                            {layer.ratio}x - {harmonic?.label || layer.label}
                          </div>
                          {layer.effect !== 'none' && (
                            <div className="text-xs text-purple-400 mt-0.5">
                              Effect: {layer.effect}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onRemoveLayer(index)}
                          className="px-2 py-1 text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Beat Frequency Control */}
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">
                          Pulse: {layer.beatFrequency.toFixed(1)} Hz
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="10"
                          step="0.1"
                          value={layer.beatFrequency}
                          onChange={(e) =>
                            onUpdateLayerBeat(index, parseFloat(e.target.value))
                          }
                          className="slider w-full h-1"
                        />
                      </div>

                      {/* Volume Control */}
                      <div className="space-y-1">
                        <label className="text-xs text-gray-400">
                          Volume: {Math.round(layer.volume * 100)}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={layer.volume}
                          onChange={(e) =>
                            onUpdateLayerVolume(index, parseFloat(e.target.value))
                          }
                          className="slider w-full h-1"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {layers.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-4">
              No harmonic layers active. Add a layer to begin.
            </div>
          )}
        </>
      )}
    </div>
  );
}
