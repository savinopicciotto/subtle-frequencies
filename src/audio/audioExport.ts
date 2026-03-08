/**
 * Audio loop export — renders the current audio stack into a seamless WAV loop
 * via OfflineAudioContext for sample-exact, faster-than-realtime rendering.
 */

import type { HarmonicEffect } from './harmonicEngine';
import type { TextureType } from './textureEngine';
import { type TimbreType, applyTimbre } from './timbres';

// ─── Types ───────────────────────────────────────────────────────────

export interface AudioExportParams {
  masterVolume: number;
  frequency: number;
  frequencyVolume: number;
  frequencyPlaying: boolean;
  timbre: TimbreType;

  binauralEnabled: boolean;
  binauralBaseFreq: number;
  binauralBeatHz: number;
  binauralVolume: number;

  harmonicsEnabled: boolean;
  harmonicLayers: Array<{
    ratio: number;
    beatFrequency: number;
    volume: number;
    effect: HarmonicEffect;
    timbre?: TimbreType | null;
  }>;

  textureType: TextureType;
  textureVolume: number;

  // Evolution — individual toggles for movement layers
  evolutionFilter: boolean;  // Slow lowpass filter sweep
  evolutionDrift: boolean;   // Subtle stereo panning drift
  evolutionBreathing: boolean; // Slow volume swell (inhale/exhale)
  evolutionSpeed: number;    // 0-1: slow (1 cycle/loop) to fast (8 cycles/loop)
}


// ─── Offline Graph Builders ──────────────────────────────────────────

function buildFrequencyGraph(
  ctx: OfflineAudioContext,
  master: GainNode,
  params: AudioExportParams,
): void {
  if (!params.frequencyPlaying || params.frequency <= 0) return;

  const osc = ctx.createOscillator();
  applyTimbre(osc, ctx, params.timbre);
  osc.frequency.value = params.frequency;

  const gain = ctx.createGain();
  gain.gain.value = params.frequencyVolume;

  osc.connect(gain);
  gain.connect(master);
  osc.start(0);
}

function buildBinauralGraph(
  ctx: OfflineAudioContext,
  master: GainNode,
  params: AudioExportParams,
): void {
  if (!params.binauralEnabled || params.binauralBeatHz <= 0) return;

  const leftOsc = ctx.createOscillator();
  const rightOsc = ctx.createOscillator();
  leftOsc.type = 'sine';
  rightOsc.type = 'sine';
  leftOsc.frequency.value = params.binauralBaseFreq;
  rightOsc.frequency.value = params.binauralBaseFreq + params.binauralBeatHz;

  const leftGain = ctx.createGain();
  const rightGain = ctx.createGain();
  leftGain.gain.value = params.binauralVolume;
  rightGain.gain.value = params.binauralVolume;

  const leftPan = ctx.createStereoPanner();
  const rightPan = ctx.createStereoPanner();
  leftPan.pan.value = -1;
  rightPan.pan.value = 1;

  leftOsc.connect(leftGain);
  leftGain.connect(leftPan);
  leftPan.connect(master);

  rightOsc.connect(rightGain);
  rightGain.connect(rightPan);
  rightPan.connect(master);

  leftOsc.start(0);
  rightOsc.start(0);
}

/**
 * Snap a desired LFO rate to the nearest integer-cycle-per-loop rate.
 * Guarantees the oscillator completes exact whole cycles within the loop.
 */
function snapRate(desiredHz: number, durationSec: number): number {
  const cycles = Math.max(1, Math.round(desiredHz * durationSec));
  return cycles / durationSec;
}

function buildHarmonicGraph(
  ctx: OfflineAudioContext,
  master: GainNode,
  params: AudioExportParams,
  durationSec: number,
): void {
  if (!params.harmonicsEnabled || params.harmonicLayers.length === 0) return;

  params.harmonicLayers.forEach((layer, idx) => {
    const harmonicFreq = params.frequency * layer.ratio;
    if (harmonicFreq <= 0) return;

    // Main oscillator
    const osc = ctx.createOscillator();
    applyTimbre(osc, ctx, layer.timbre || params.timbre);
    osc.frequency.value = harmonicFreq;
    // Deterministic subtle detune per layer (±1 cent)
    osc.detune.value = ((idx * 0.618) % 1 - 0.5) * 2;

    // Gain
    const gain = ctx.createGain();
    gain.gain.value = layer.volume;

    // Breathing modulation — snapped to loop duration
    const breathingOsc = ctx.createOscillator();
    const breathingGain = ctx.createGain();
    breathingOsc.type = 'sine';
    const desiredBreathRate = 0.08 + (idx * 0.03) % 0.1; // 0.08–0.18 Hz
    breathingOsc.frequency.value = snapRate(desiredBreathRate, durationSec);
    breathingGain.gain.value = layer.volume * 0.2;
    breathingOsc.connect(breathingGain);
    breathingGain.connect(gain.gain);
    breathingOsc.start(0);

    // Vibrato — snapped to loop duration
    const vibratoOsc = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibratoOsc.type = 'triangle';
    const desiredVibratoRate = 2.5 + (idx * 0.5) % 1.5; // 2.5–4 Hz
    vibratoOsc.frequency.value = snapRate(desiredVibratoRate, durationSec);
    vibratoGain.gain.value = 3 + (idx % 3); // 3–5 cents
    vibratoOsc.connect(vibratoGain);
    vibratoGain.connect(osc.detune);
    vibratoOsc.start(0);

    // Beat/tremolo LFO — snapped to loop duration
    if (layer.beatFrequency > 0) {
      const lfoOsc = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfoOsc.type = 'sine';
      lfoOsc.frequency.value = snapRate(layer.beatFrequency, durationSec);
      lfoGain.gain.value = layer.volume * 0.4;
      lfoOsc.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfoOsc.start(0);
    }

    // Special effects — snapped to loop duration
    applyOfflineEffect(ctx, osc, gain, layer.effect, layer.volume, idx, durationSec);

    osc.connect(gain);
    gain.connect(master);
    osc.start(0);
  });
}

function applyOfflineEffect(
  ctx: OfflineAudioContext,
  osc: OscillatorNode,
  gain: GainNode,
  effect: HarmonicEffect,
  volume: number,
  idx: number,
  durationSec: number,
): void {
  if (effect === 'none') return;

  const effectOsc = ctx.createOscillator();
  const effectGain = ctx.createGain();

  switch (effect) {
    case 'bend-up':
      effectOsc.type = 'sawtooth';
      effectOsc.frequency.value = snapRate(0.05 + (idx * 0.02) % 0.05, durationSec);
      effectGain.gain.value = 30 + (idx * 7) % 20;
      effectOsc.connect(effectGain);
      effectGain.connect(osc.detune);
      break;
    case 'bend-down':
      effectOsc.type = 'sawtooth';
      effectOsc.frequency.value = snapRate(0.05 + (idx * 0.02) % 0.05, durationSec);
      effectGain.gain.value = -(30 + (idx * 7) % 20);
      effectOsc.connect(effectGain);
      effectGain.connect(osc.detune);
      break;
    case 'trickle':
      effectOsc.type = 'square';
      effectOsc.frequency.value = snapRate(0.2 + (idx * 0.1) % 0.3, durationSec);
      effectGain.gain.value = 15 + (idx * 4) % 10;
      effectOsc.connect(effectGain);
      effectGain.connect(osc.detune);
      break;
    case 'shake':
      effectOsc.type = 'triangle';
      effectOsc.frequency.value = snapRate(10 + (idx * 3) % 10, durationSec);
      effectGain.gain.value = 8 + (idx * 3) % 7;
      effectOsc.connect(effectGain);
      effectGain.connect(osc.detune);
      break;
    case 'buzz':
      effectOsc.type = 'sine';
      effectOsc.frequency.value = snapRate(40 + (idx * 13) % 40, durationSec);
      effectGain.gain.value = volume * 0.3;
      effectOsc.connect(effectGain);
      effectGain.connect(gain.gain);
      break;
  }

  effectOsc.start(0);
}

function buildTextureGraph(
  ctx: OfflineAudioContext,
  master: GainNode,
  params: AudioExportParams,
  durationSec: number,
): void {
  if (params.textureType === 'none') return;

  const sampleRate = ctx.sampleRate;
  const bufferSize = sampleRate * 2; // 2 seconds, looped
  const noiseBuffer = ctx.createBuffer(2, bufferSize, sampleRate);

  // Generate noise per channel
  for (let ch = 0; ch < 2; ch++) {
    const data = noiseBuffer.getChannelData(ch);
    switch (params.textureType) {
      case 'warm-pad':
      case 'rain':
        generatePinkNoise(data);
        break;
      case 'ocean':
        generateBrownNoise(data);
        break;
      case 'singing-bowl':
        generateHarmonicNoise(data, sampleRate);
        break;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  // Filter
  const filter = ctx.createBiquadFilter();
  configureTextureFilter(filter, params.textureType);

  // Gain
  const gain = ctx.createGain();
  gain.gain.value = params.textureVolume;

  source.connect(filter);
  filter.connect(gain);

  // LFO for warm-pad / ocean — snapped to loop duration
  if (params.textureType === 'warm-pad' || params.textureType === 'ocean') {
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.type = 'sine';
    if (params.textureType === 'warm-pad') {
      lfo.frequency.value = snapRate(0.2, durationSec);
      lfoGain.gain.value = 0.05;
    } else {
      lfo.frequency.value = snapRate(0.15, durationSec);
      lfoGain.gain.value = 0.1;
    }
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start(0);
  }

  gain.connect(master);
  source.start(0);
}

// ─── Noise Generators (mirroring TextureEngine) ─────────────────────

function generatePinkNoise(output: Float32Array): void {
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < output.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.96900 * b2 + white * 0.1538520;
    b3 = 0.86650 * b3 + white * 0.3104856;
    b4 = 0.55000 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.0168980;
    output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
}

function generateBrownNoise(output: Float32Array): void {
  let lastOut = 0;
  for (let i = 0; i < output.length; i++) {
    const white = Math.random() * 2 - 1;
    output[i] = (lastOut + 0.02 * white) / 1.02;
    lastOut = output[i];
    output[i] *= 3.5;
  }
}

function generateHarmonicNoise(output: Float32Array, sampleRate: number): void {
  const fundamentalFreq = 200;
  const harmonics = [1, 2.1, 3.2, 4.3, 5.5, 6.8];
  for (let i = 0; i < output.length; i++) {
    let sample = 0;
    const t = i / sampleRate;
    harmonics.forEach((harmonic, idx) => {
      const freq = fundamentalFreq * harmonic;
      const amplitude = 1 / (idx + 1);
      const decay = Math.exp(-t * (idx + 1) * 0.5);
      sample += Math.sin(2 * Math.PI * freq * t) * amplitude * decay;
    });
    sample += (Math.random() * 2 - 1) * 0.05;
    output[i] = sample * 0.3;
  }
}

function configureTextureFilter(filter: BiquadFilterNode, texture: TextureType): void {
  switch (texture) {
    case 'warm-pad':
      filter.type = 'lowpass';
      filter.frequency.value = 800;
      filter.Q.value = 1;
      break;
    case 'ocean':
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      filter.Q.value = 0.5;
      break;
    case 'rain':
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 1;
      break;
    case 'singing-bowl':
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      filter.Q.value = 2;
      break;
  }
}


// ─── Evolution: Master Filter Sweep + Stereo Drift ──────────────────

/**
 * Insert optional evolution layers on the master bus. Each is independently toggleable.
 * All LFO rates are snapped to integer cycles per loop for seamless looping.
 *
 * Returns the node that audio sources should connect TO.
 * Chain: [sources] → inputNode → [filter?] → [breathing?] → [drift?] → masterGain
 */
function buildEvolution(
  ctx: OfflineAudioContext,
  masterGain: GainNode,
  params: AudioExportParams,
  durationSec: number,
): GainNode {
  const speed = params.evolutionSpeed;
  const cyclesPerLoop = Math.max(1, Math.round(1 + speed * 7));

  // Build chain backwards from masterGain
  let currentTarget: AudioNode = masterGain;

  // --- Stereo drift (outermost — applied last) ---
  if (params.evolutionDrift) {
    const driftCycles = Math.max(1, Math.round(cyclesPerLoop * 0.5));
    const driftRate = driftCycles / durationSec;

    const panner = ctx.createStereoPanner();
    const panLfo = ctx.createOscillator();
    const panLfoGain = ctx.createGain();
    panLfo.type = 'sine';
    panLfo.frequency.value = driftRate;
    panLfoGain.gain.value = 0.15; // ±15% pan
    panLfo.connect(panLfoGain);
    panLfoGain.connect(panner.pan);
    panLfo.start(0);

    panner.connect(currentTarget);
    currentTarget = panner;
  }

  // --- Volume breathing (slow swell) ---
  if (params.evolutionBreathing) {
    const breathCycles = Math.max(1, Math.round(cyclesPerLoop * 0.7));
    const breathRate = breathCycles / durationSec;

    const breathGain = ctx.createGain();
    breathGain.gain.value = 1.0;

    const breathLfo = ctx.createOscillator();
    const breathLfoGain = ctx.createGain();
    breathLfo.type = 'sine';
    breathLfo.frequency.value = breathRate;
    breathLfoGain.gain.value = 0.12; // ±12% volume swell
    breathLfo.connect(breathLfoGain);
    breathLfoGain.connect(breathGain.gain);
    breathLfo.start(0);

    breathGain.connect(currentTarget);
    currentTarget = breathGain;
  }

  // --- Filter sweep (innermost — applied first) ---
  if (params.evolutionFilter) {
    const lfoRate = cyclesPerLoop / durationSec;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.Q.value = 0.7;
    filter.frequency.value = 3000;

    const filterLfo = ctx.createOscillator();
    const filterLfoGain = ctx.createGain();
    filterLfo.type = 'sine';
    filterLfo.frequency.value = lfoRate;
    filterLfoGain.gain.value = 1500; // Sweeps 1500–4500 Hz
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    filterLfo.start(0);

    filter.connect(currentTarget);
    currentTarget = filter;
  }

  // Input node — all sources connect here
  const inputNode = ctx.createGain();
  inputNode.gain.value = 1;
  inputNode.connect(currentTarget);

  return inputNode;
}

// ─── Main Render Function ────────────────────────────────────────────

export async function renderAudioLoop(
  params: AudioExportParams,
  durationSec: number,
  sampleRate: number = 48000,
): Promise<AudioBuffer> {
  const totalSamples = Math.round(durationSec * sampleRate);
  const offline = new OfflineAudioContext(2, totalSamples, sampleRate);

  const masterGain = offline.createGain();
  masterGain.gain.value = params.masterVolume;
  masterGain.connect(offline.destination);

  const hasEvolution = params.evolutionFilter || params.evolutionDrift || params.evolutionBreathing;
  const audioTarget = hasEvolution
    ? buildEvolution(offline, masterGain, params, durationSec)
    : masterGain;

  buildFrequencyGraph(offline, audioTarget, params);
  buildBinauralGraph(offline, audioTarget, params);
  buildHarmonicGraph(offline, audioTarget, params, durationSec);
  buildTextureGraph(offline, audioTarget, params, durationSec);

  return offline.startRendering();
}

// ─── Stem Export ─────────────────────────────────────────────────────

export type StemType = 'frequency' | 'binaural' | 'harmonics' | 'texture';

export interface StemResult {
  type: StemType;
  label: string;
  buffer: AudioBuffer;
}

/**
 * Render each active layer as a separate stem (same duration/alignment).
 * Returns an array of labeled AudioBuffers for individual WAV export.
 */
export async function renderStems(
  params: AudioExportParams,
  durationSec: number,
  sampleRate: number = 48000,
): Promise<StemResult[]> {
  const totalSamples = Math.round(durationSec * sampleRate);
  const stems: StemResult[] = [];

  // Stem builders — each renders one layer in isolation
  const stemConfigs: Array<{
    type: StemType;
    label: string;
    active: boolean;
    build: (ctx: OfflineAudioContext, target: GainNode) => void;
  }> = [
    {
      type: 'frequency',
      label: `${Math.round(params.frequency)}Hz`,
      active: params.frequencyPlaying && params.frequency > 0,
      build: (ctx, target) => buildFrequencyGraph(ctx, target, params),
    },
    {
      type: 'binaural',
      label: `Binaural ${params.binauralBeatHz}Hz`,
      active: params.binauralEnabled && params.binauralBeatHz > 0,
      build: (ctx, target) => buildBinauralGraph(ctx, target, params),
    },
    {
      type: 'harmonics',
      label: `Harmonics (${params.harmonicLayers.length})`,
      active: params.harmonicsEnabled && params.harmonicLayers.length > 0,
      build: (ctx, target) => buildHarmonicGraph(ctx, target, params, durationSec),
    },
    {
      type: 'texture',
      label: params.textureType.charAt(0).toUpperCase() + params.textureType.slice(1),
      active: params.textureType !== 'none' && params.textureVolume > 0,
      build: (ctx, target) => buildTextureGraph(ctx, target, params, durationSec),
    },
  ];

  for (const config of stemConfigs) {
    if (!config.active) continue;

    const offline = new OfflineAudioContext(2, totalSamples, sampleRate);
    const gain = offline.createGain();
    gain.gain.value = 1.0; // Full volume per stem — user mixes in DAW
    gain.connect(offline.destination);

    config.build(offline, gain);
    const rendered = await offline.startRendering();

    stems.push({ type: config.type, label: config.label, buffer: rendered });
  }

  return stems;
}

export function generateStemFilename(
  params: AudioExportParams,
  stemType: StemType,
  _stemLabel: string,
  duration: number,
  sampleRate: number,
): string {
  const parts: string[] = ['subtle-frequencies'];
  parts.push(`${Math.round(params.frequency)}Hz`);
  parts.push(stemType);
  parts.push(`${duration.toFixed(1)}s`);
  parts.push(`${Math.round(sampleRate / 1000)}k`);
  return parts.join('_') + '.wav';
}

// ─── WAV Encoding ────────────────────────────────────────────────────

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

export function encodeWAV(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = buffer.length;
  const dataSize = numSamples * blockAlign;
  const totalSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Interleave channels as 16-bit PCM
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, int16, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

// ─── Filename ────────────────────────────────────────────────────────

export function generateAudioFilename(
  params: AudioExportParams,
  duration: number,
  sampleRate: number,
): string {
  const parts: string[] = ['subtle-frequencies'];
  parts.push(`${Math.round(params.frequency)}Hz`);

  if (params.binauralEnabled) {
    parts.push(`binaural-${params.binauralBeatHz}Hz`);
  }

  if (params.harmonicsEnabled && params.harmonicLayers.length > 0) {
    parts.push(`${params.harmonicLayers.length}harmonics`);
  }

  if (params.textureType !== 'none') {
    parts.push(params.textureType);
  }

  parts.push(`${duration.toFixed(1)}s`);
  parts.push(`${Math.round(sampleRate / 1000)}k`);

  return parts.join('_') + '.wav';
}
