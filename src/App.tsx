/**
 * Main application component
 */

import { useState, useEffect, useRef } from 'react';
import { useAudioContext } from './hooks/useAudioContext';
import { FrequencyEngine } from './audio/frequencyEngine';
import { BinauralEngine } from './audio/binauralEngine';
import { TextureEngine } from './audio/textureEngine';
import { HarmonicEngine, type HarmonicEffect } from './audio/harmonicEngine';
import { CymaticVisualizer } from './components/CymaticVisualizer';
import { FrequencyPlayer } from './components/FrequencyPlayer';
import { BinauralBeats } from './components/BinauralBeats';
import { AmbientTexture } from './components/AmbientTexture';
import { SessionTimer } from './components/SessionTimer';
import { PresetManager } from './components/PresetManager';
import { HarmonicLayers } from './components/HarmonicLayers';
import type { Preset } from './utils/presets';
import type { BrainwaveState } from './audio/binauralEngine';
import type { TextureType } from './audio/textureEngine';

function App() {
  const { isInitialized, initialize } = useAudioContext();
  const [showInitScreen, setShowInitScreen] = useState(true);

  // Audio engines (singleton instances)
  const frequencyEngine = useRef(new FrequencyEngine());
  const binauralEngine = useRef(new BinauralEngine());
  const textureEngine = useRef(new TextureEngine());
  const harmonicEngine = useRef(new HarmonicEngine());

  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(432);
  const [frequencyVolume, setFrequencyVolume] = useState(0.5);
  const [binauralEnabled, setBinauralEnabled] = useState(false);
  const [binauralState, setBinauralState] = useState<BrainwaveState>('alpha');
  const [binauralBeatHz, setBinauralBeatHz] = useState(10);
  const [binauralVolume, setBinauralVolume] = useState(0.3);
  const [texture, setTexture] = useState<TextureType>('none');
  const [textureVolume, setTextureVolume] = useState(0.2);
  const [harmonicsEnabled, setHarmonicsEnabled] = useState(false);
  const [harmonicLayers, setHarmonicLayers] = useState<
    Array<{ ratio: number; beatFrequency: number; volume: number; effect: HarmonicEffect; label: string }>
  >([]);

  // Initialize audio on user gesture
  const handleStart = async () => {
    try {
      await initialize();
      setShowInitScreen(false);
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      alert('Failed to initialize audio. Please check your browser permissions.');
    }
  };

  // Play/Stop toggle
  const handlePlayToggle = () => {
    if (!isInitialized) {
      handleStart();
      return;
    }

    if (isPlaying) {
      // Stop all engines
      frequencyEngine.current.stop();
      if (binauralEnabled) {
        binauralEngine.current.stop();
      }
      textureEngine.current.stop();
      if (harmonicsEnabled) {
        harmonicEngine.current.stop();
      }
      setIsPlaying(false);
    } else {
      // Start all engines
      frequencyEngine.current.start(frequency, frequencyVolume);
      if (binauralEnabled) {
        binauralEngine.current.start(frequency, binauralBeatHz, binauralVolume);
      }
      if (texture !== 'none') {
        textureEngine.current.start(texture, textureVolume);
      }
      if (harmonicsEnabled && harmonicLayers.length > 0) {
        harmonicEngine.current.start();
      }
      setIsPlaying(true);
    }
  };

  // Update frequency
  const handleFrequencyChange = (newFreq: number) => {
    setFrequency(newFreq);
    harmonicEngine.current.updateBaseFrequency(newFreq);
    if (isPlaying) {
      frequencyEngine.current.updateFrequency(newFreq);
      if (binauralEnabled) {
        binauralEngine.current.update(newFreq, binauralBeatHz, binauralVolume);
      }
    }
  };

  // Update frequency volume
  const handleFrequencyVolumeChange = (vol: number) => {
    setFrequencyVolume(vol);
    if (isPlaying) {
      frequencyEngine.current.updateVolume(vol);
    }
  };

  // Update binaural enabled
  const handleBinauralEnabledChange = (enabled: boolean) => {
    setBinauralEnabled(enabled);
    if (isPlaying) {
      if (enabled) {
        binauralEngine.current.start(frequency, binauralBeatHz, binauralVolume);
      } else {
        binauralEngine.current.stop();
      }
    }
  };

  // Update binaural state
  const handleBinauralStateChange = (state: BrainwaveState) => {
    setBinauralState(state);
  };

  // Update binaural beat Hz
  const handleBinauralBeatHzChange = (hz: number) => {
    setBinauralBeatHz(hz);
    if (isPlaying && binauralEnabled) {
      binauralEngine.current.update(frequency, hz, binauralVolume);
    }
  };

  // Update binaural volume
  const handleBinauralVolumeChange = (vol: number) => {
    setBinauralVolume(vol);
    if (isPlaying && binauralEnabled) {
      binauralEngine.current.update(frequency, binauralBeatHz, vol);
    }
  };

  // Update texture
  const handleTextureChange = (newTexture: TextureType) => {
    setTexture(newTexture);
    if (isPlaying) {
      textureEngine.current.stop();
      if (newTexture !== 'none') {
        setTimeout(() => {
          textureEngine.current.start(newTexture, textureVolume);
        }, 100);
      }
    }
  };

  // Update texture volume
  const handleTextureVolumeChange = (vol: number) => {
    setTextureVolume(vol);
    if (isPlaying && texture !== 'none') {
      textureEngine.current.updateVolume(vol);
    }
  };

  // Handle harmonics enabled change
  const handleHarmonicsEnabledChange = (enabled: boolean) => {
    setHarmonicsEnabled(enabled);
    if (isPlaying) {
      if (enabled && harmonicLayers.length > 0) {
        harmonicEngine.current.start();
      } else {
        harmonicEngine.current.stop();
      }
    }
  };

  // Add harmonic layer
  const handleAddHarmonicLayer = (ratio: number, beatFreq: number, volume: number, effect: HarmonicEffect) => {
    // Add to state
    const label = `${ratio}x Harmonic`;
    const newLayer = { ratio, beatFrequency: beatFreq, volume, effect, label };
    const newLayers = [...harmonicLayers, newLayer];
    setHarmonicLayers(newLayers);

    // Rebuild all layers in engine
    harmonicEngine.current.stopImmediate();
    harmonicEngine.current.clearLayers();

    newLayers.forEach(layer => {
      harmonicEngine.current.addLayer(layer.ratio, layer.beatFrequency, layer.volume, layer.effect);
    });

    // Start if main audio is playing
    if (isPlaying) {
      harmonicEngine.current.start();
    }
  };

  // Load harmonic preset
  const handleLoadHarmonicPreset = (
    layers: Array<{ ratio: number; beatFrequency: number; volume: number; effect: HarmonicEffect }>
  ) => {
    // Update state
    const layersWithLabels = layers.map((layer) => ({
      ...layer,
      label: `${layer.ratio}x Harmonic`,
    }));
    setHarmonicLayers(layersWithLabels);

    // Enable harmonics if not already enabled
    if (!harmonicsEnabled) {
      setHarmonicsEnabled(true);
    }

    // Rebuild all layers in engine
    harmonicEngine.current.stopImmediate();
    harmonicEngine.current.clearLayers();

    layers.forEach(layer => {
      harmonicEngine.current.addLayer(layer.ratio, layer.beatFrequency, layer.volume, layer.effect);
    });

    // Start harmonics if main audio is playing
    if (isPlaying) {
      harmonicEngine.current.start();
    }
  };

  // Remove harmonic layer
  const handleRemoveHarmonicLayer = (index: number) => {
    // Remove from state
    const newLayers = [...harmonicLayers];
    newLayers.splice(index, 1);
    setHarmonicLayers(newLayers);

    // Rebuild all layers in engine
    harmonicEngine.current.stopImmediate();
    harmonicEngine.current.clearLayers();

    newLayers.forEach(layer => {
      harmonicEngine.current.addLayer(layer.ratio, layer.beatFrequency, layer.volume, layer.effect);
    });

    // Start if main audio is playing and we still have layers
    if (isPlaying && newLayers.length > 0) {
      harmonicEngine.current.start();
    }
  };

  // Update harmonic layer beat frequency
  const handleUpdateHarmonicBeat = (index: number, beatFreq: number) => {
    const newLayers = [...harmonicLayers];
    newLayers[index].beatFrequency = beatFreq;
    setHarmonicLayers(newLayers);
    harmonicEngine.current.updateLayerBeat(index, beatFreq);
  };

  // Update harmonic layer volume
  const handleUpdateHarmonicVolume = (index: number, volume: number) => {
    const newLayers = [...harmonicLayers];
    newLayers[index].volume = volume;
    setHarmonicLayers(newLayers);
    harmonicEngine.current.updateLayerVolume(index, volume);
  };

  // Handle timer end
  const handleTimerEnd = () => {
    // Fade out over 3 seconds
    const fadeSteps = 30;
    const fadeInterval = 100; // ms
    let step = 0;

    const fadeOut = setInterval(() => {
      step++;
      const newVolume = frequencyVolume * (1 - step / fadeSteps);
      frequencyEngine.current.updateVolume(newVolume);

      if (binauralEnabled) {
        binauralEngine.current.update(frequency, binauralBeatHz, binauralVolume * (1 - step / fadeSteps));
      }

      if (texture !== 'none') {
        textureEngine.current.updateVolume(textureVolume * (1 - step / fadeSteps));
      }

      if (step >= fadeSteps) {
        clearInterval(fadeOut);
        handlePlayToggle(); // Stop playback
      }
    }, fadeInterval);
  };

  // Load preset
  const handleLoadPreset = (preset: Preset) => {
    setFrequency(preset.frequency);
    setFrequencyVolume(preset.frequencyVolume);
    setBinauralEnabled(preset.binauralEnabled);
    setBinauralState(preset.binauralState);
    setBinauralBeatHz(preset.binauralBeatHz);
    setBinauralVolume(preset.binauralVolume);
    setTexture(preset.texture);
    setTextureVolume(preset.textureVolume);

    // If playing, update engines
    if (isPlaying) {
      frequencyEngine.current.updateFrequency(preset.frequency);
      frequencyEngine.current.updateVolume(preset.frequencyVolume);

      if (preset.binauralEnabled && !binauralEnabled) {
        binauralEngine.current.start(preset.frequency, preset.binauralBeatHz, preset.binauralVolume);
      } else if (!preset.binauralEnabled && binauralEnabled) {
        binauralEngine.current.stop();
      } else if (preset.binauralEnabled) {
        binauralEngine.current.update(preset.frequency, preset.binauralBeatHz, preset.binauralVolume);
      }

      if (preset.texture !== texture) {
        textureEngine.current.stop();
        if (preset.texture !== 'none') {
          setTimeout(() => {
            textureEngine.current.start(preset.texture, preset.textureVolume);
          }, 100);
        }
      } else if (preset.texture !== 'none') {
        textureEngine.current.updateVolume(preset.textureVolume);
      }
    }
  };

  // Get current preset state
  const getCurrentPreset = (): Preset => ({
    name: 'Current',
    frequency,
    binauralEnabled,
    binauralState,
    binauralBeatHz,
    texture,
    frequencyVolume,
    binauralVolume,
    textureVolume,
    timerMinutes: 15,
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      frequencyEngine.current.stop();
      binauralEngine.current.stop();
      textureEngine.current.stop();
    };
  }, []);

  if (showInitScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-md w-full text-center space-y-6">
          <h1 className="text-4xl font-display mb-2">Subtle Frequencies</h1>
          <p className="text-gray-300">
            A premium healing frequency generator with binaural beats and ambient textures.
          </p>
          <p className="text-sm text-gray-400">
            For the best experience, use headphones.
          </p>
          <button onClick={handleStart} className="btn-primary w-full text-lg py-4">
            Begin Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-display mb-2">Subtle Frequencies</h1>
          <p className="text-gray-400">Healing tones for mind and body</p>
        </header>

        {/* Cymatic Visualizer */}
        <CymaticVisualizer isPlaying={isPlaying} frequency={frequency} />

        {/* Main Controls */}
        <FrequencyPlayer
          frequency={frequency}
          volume={frequencyVolume}
          isPlaying={isPlaying}
          onFrequencyChange={handleFrequencyChange}
          onVolumeChange={handleFrequencyVolumeChange}
          onPlayToggle={handlePlayToggle}
        />

        {/* Binaural Beats */}
        <BinauralBeats
          enabled={binauralEnabled}
          brainwaveState={binauralState}
          beatHz={binauralBeatHz}
          volume={binauralVolume}
          onEnabledChange={handleBinauralEnabledChange}
          onBrainwaveStateChange={handleBinauralStateChange}
          onBeatHzChange={handleBinauralBeatHzChange}
          onVolumeChange={handleBinauralVolumeChange}
        />

        {/* Ambient Texture */}
        <AmbientTexture
          texture={texture}
          volume={textureVolume}
          onTextureChange={handleTextureChange}
          onVolumeChange={handleTextureVolumeChange}
        />

        {/* Harmonic Layers */}
        <HarmonicLayers
          enabled={harmonicsEnabled}
          layers={harmonicLayers}
          onEnabledChange={handleHarmonicsEnabledChange}
          onAddLayer={handleAddHarmonicLayer}
          onRemoveLayer={handleRemoveHarmonicLayer}
          onUpdateLayerBeat={handleUpdateHarmonicBeat}
          onUpdateLayerVolume={handleUpdateHarmonicVolume}
          onLoadPreset={handleLoadHarmonicPreset}
        />

        {/* Session Timer */}
        <SessionTimer isPlaying={isPlaying} onTimerEnd={handleTimerEnd} />

        {/* Presets */}
        <PresetManager
          currentPreset={getCurrentPreset()}
          onLoadPreset={handleLoadPreset}
          onUpdateCurrentPreset={() => {}}
        />

        {/* Ad Placeholder */}
        <div className="h-[50px] bg-white/5 rounded-lg border border-white/10 flex items-center justify-center text-xs text-gray-500">
          {/* Ad placement - 320x50 banner */}
        </div>

        {/* Footer */}
        <footer className="text-center text-sm text-gray-500 py-8">
          <p>© 2026 Subtle Frequencies. Premium healing sound therapy.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
