/**
 * Compact status bar showing all active sound parameters at a glance
 */

import type { HarmonicEffect } from '../audio/harmonicEngine';
import type { TextureType } from '../audio/textureEngine';
import type { BrainwaveState } from '../audio/binauralEngine';

interface HarmonicLayerInfo {
  ratio: number;
  beatFrequency: number;
  volume: number;
  effect: HarmonicEffect;
  label: string;
  muted: boolean;
}

interface StatusBarProps {
  isPlaying: boolean;
  frequency: number;
  frequencyVolume: number;
  binauralEnabled: boolean;
  binauralState: BrainwaveState;
  binauralBeatHz: number;
  binauralVolume: number;
  harmonicsEnabled: boolean;
  harmonicLayers: HarmonicLayerInfo[];
  texture: TextureType;
  textureVolume: number;
}

export function StatusBar({
  isPlaying,
  frequency,
  frequencyVolume,
  binauralEnabled,
  binauralState,
  binauralBeatHz,
  binauralVolume,
  harmonicsEnabled,
  harmonicLayers,
  texture,
  textureVolume,
}: StatusBarProps) {
  if (!isPlaying) return null;

  const activeLayers = harmonicLayers.filter((l) => !l.muted);
  const textureLabel = texture === 'none' ? null : texture.charAt(0).toUpperCase() + texture.slice(1);

  return (
    <div className="glass-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        {/* Base frequency */}
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
          <span className="text-white font-medium">{frequency}Hz</span>
          <span className="text-gray-500">{Math.round(frequencyVolume * 100)}%</span>
        </div>

        {/* Binaural */}
        {binauralEnabled && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-blue-300 font-medium">
              {binauralState.charAt(0).toUpperCase() + binauralState.slice(1)} {binauralBeatHz}Hz
            </span>
            <span className="text-gray-500">{Math.round(binauralVolume * 100)}%</span>
          </div>
        )}

        {/* Harmonics */}
        {harmonicsEnabled && activeLayers.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            <span className="text-purple-300 font-medium">
              {activeLayers.length} harmonic{activeLayers.length !== 1 ? 's' : ''}
            </span>
            <span className="text-gray-500">
              {activeLayers.map((l) => `${l.ratio}x`).join(' ')}
            </span>
          </div>
        )}

        {/* Texture */}
        {textureLabel && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-green-300 font-medium">{textureLabel}</span>
            <span className="text-gray-500">{Math.round(textureVolume * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
