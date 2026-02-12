/**
 * Preset management component for saving and loading configurations
 */

import { useState } from 'react';
import { getAllPresets, savePreset, deletePreset, DEFAULT_PRESETS } from '../utils/presets';
import type { Preset } from '../utils/presets';

interface PresetManagerProps {
  currentPreset: Preset;
  onLoadPreset: (preset: Preset) => void;
  onUpdateCurrentPreset: (preset: Partial<Preset>) => void;
}

export function PresetManager({
  currentPreset,
  onLoadPreset,
  onUpdateCurrentPreset: _onUpdateCurrentPreset,
}: PresetManagerProps) {
  const [allPresets, setAllPresets] = useState(getAllPresets());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSave = () => {
    if (!presetName.trim()) return;

    const newPreset = { ...currentPreset, name: presetName.trim() };
    savePreset(newPreset);
    setAllPresets(getAllPresets());
    setShowSaveDialog(false);
    setPresetName('');
  };

  const handleDelete = (name: string) => {
    if (DEFAULT_PRESETS.some((p) => p.name === name)) {
      alert('Cannot delete default presets');
      return;
    }

    if (confirm(`Delete preset "${name}"?`)) {
      deletePreset(name);
      setAllPresets(getAllPresets());
    }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display">Presets</h2>
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          className="btn-secondary text-sm"
        >
          💾 Save Current
        </button>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-3">
          <input
            type="text"
            value={presetName}
            onChange={(e) => setPresetName(e.target.value)}
            placeholder="Enter preset name..."
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-primary flex-1 text-sm">
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveDialog(false);
                setPresetName('');
              }}
              className="btn-secondary flex-1 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Preset List */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Available Presets</label>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {allPresets.map((preset) => {
            const isDefault = DEFAULT_PRESETS.some((p) => p.name === preset.name);
            return (
              <div
                key={preset.name}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
              >
                <button
                  onClick={() => onLoadPreset(preset)}
                  className="flex-1 text-left"
                >
                  <div className="font-semibold">{preset.name}</div>
                  <div className="text-xs text-gray-400">
                    {preset.frequency}Hz
                    {preset.binauralEnabled && ` • ${preset.binauralState} binaural`}
                    {preset.texture !== 'none' && ` • ${preset.texture}`}
                  </div>
                </button>
                {!isDefault && (
                  <button
                    onClick={() => handleDelete(preset.name)}
                    className="ml-2 px-2 py-1 text-sm text-red-400 hover:text-red-300"
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
