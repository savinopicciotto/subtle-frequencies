/**
 * Ambient texture control component
 */

import type { TextureType } from '../audio/textureEngine';

interface AmbientTextureProps {
  texture: TextureType;
  volume: number;
  onTextureChange: (texture: TextureType) => void;
  onVolumeChange: (vol: number) => void;
}

const TEXTURES: { type: TextureType; label: string; description: string }[] = [
  { type: 'none', label: 'None', description: 'Pure tone only' },
  { type: 'warm-pad', label: 'Warm Pad', description: 'Filtered noise with modulation' },
  { type: 'ocean', label: 'Ocean', description: 'Brown noise with gentle waves' },
  { type: 'rain', label: 'Rain', description: 'Pink noise with light filtering' },
  { type: 'singing-bowl', label: 'Singing Bowl', description: 'Harmonic overtones' },
];

export function AmbientTexture({
  texture,
  volume,
  onTextureChange,
  onVolumeChange,
}: AmbientTextureProps) {
  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-2xl font-display">Ambient Texture</h2>

      {/* Texture Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Background Layer</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {TEXTURES.map((t) => (
            <button
              key={t.type}
              onClick={() => onTextureChange(t.type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                texture === t.type
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <div className="font-semibold">{t.label}</div>
              <div className="text-xs opacity-75">{t.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Volume Control */}
      {texture !== 'none' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Texture Volume: {Math.round(volume * 100)}%
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
      )}
    </div>
  );
}
