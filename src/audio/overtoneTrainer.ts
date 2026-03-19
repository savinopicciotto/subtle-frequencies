/**
 * Overtone Trainer — automated harmonic reveal/strip ear training tool.
 *
 * Cycle: fundamental only → add harmonics one-by-one → hold full stack →
 * strip harmonics one-by-one → hold fundamental → repeat.
 *
 * Uses a step-based state machine driven by requestAnimationFrame.
 * Only takes action on step TRANSITIONS — no repeated calls to create/destroy.
 * Operates independently of HarmonicEngine to avoid conflicts.
 */

import { audioEngine } from './AudioEngine';
import { type TimbreType, applyTimbre } from './timbres';

// ─── Types ───────────────────────────────────────────────────────────

export type TrainerPhase = 'ascending' | 'holding-top' | 'descending' | 'holding-bottom';

export interface OvertoneTrainerState {
  isRunning: boolean;
  cycleDuration: number;
  maxHarmonic: number;
  currentHarmonic: number;
  phase: TrainerPhase;
  volume: number;
  elapsed: number;       // seconds into current cycle
  profileName: string;   // active profile name
  isExporting: boolean;
}

/** A profile defines which harmonic numbers are included and in what order */
export interface OvertoneProfile {
  name: string;
  description: string;
  /** Harmonic numbers to reveal, in order. Must start with 1 (fundamental). */
  harmonics: number[];
}

// ─── Built-in Profiles ──────────────────────────────────────────────

export const OVERTONE_PROFILES: OvertoneProfile[] = [
  {
    name: 'Natural Series',
    description: 'Standard overtone series 1–N',
    harmonics: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  },
  {
    name: 'Odd Harmonics',
    description: 'Hollow/clarinet-like — odd partials only',
    harmonics: [1, 3, 5, 7, 9, 11, 13, 15],
  },
  {
    name: 'Even Harmonics',
    description: 'Warm/octave-rich — even partials',
    harmonics: [1, 2, 4, 6, 8, 10, 12, 14, 16],
  },
  {
    name: 'Perfect Intervals',
    description: 'Octaves and fifths only (2, 3, 4, 6, 8, 12)',
    harmonics: [1, 2, 3, 4, 6, 8, 12],
  },
  {
    name: 'Prime Harmonics',
    description: 'Primes only — sparse, distinctive intervals',
    harmonics: [1, 2, 3, 5, 7, 11, 13],
  },
  {
    name: 'Power of Two',
    description: 'Pure octave stacking — 1, 2, 4, 8, 16',
    harmonics: [1, 2, 4, 8, 16],
  },
  {
    name: 'Low & Dense',
    description: 'First 5 harmonics — learn the cluster',
    harmonics: [1, 2, 3, 4, 5],
  },
  {
    name: 'Golden Spiral',
    description: 'φ subharmonics down, then φ harmonics up',
    harmonics: [0.236, 0.382, 0.618, 1, 1.618, 2.618, 4.236, 6.854],
  },
];

// ─── Custom profile from Harmonic Layers ────────────────────────────

/** Sentinel name for the dynamic "From Harmonic Layers" profile */
export const CUSTOM_PROFILE_NAME = 'From Harmonic Layers';

/**
 * Build a trainer profile from the user's manually-configured Harmonic Layers.
 * Ratios are sorted ascending; the fundamental (1) is prepended if missing.
 * Returns null if there are no usable layers.
 */
export function buildCustomProfile(
  layers: Array<{ ratio: number; muted: boolean }>,
): OvertoneProfile | null {
  const ratios = layers
    .filter(l => !l.muted && l.ratio > 0)
    .map(l => l.ratio)
    .sort((a, b) => a - b);

  if (ratios.length === 0) return null;

  // Ensure fundamental is present
  if (ratios[0] !== 1) ratios.unshift(1);

  return {
    name: CUSTOM_PROFILE_NAME,
    description: `${ratios.length - 1} layers from Harmonic Layers`,
    harmonics: ratios,
  };
}

// ─── Labels ─────────────────────────────────────────────────────────

const HARMONIC_LABELS: Record<number, string> = {
  1: 'Fundamental',
  2: '2nd — Octave',
  3: '3rd — Perfect 5th + Octave',
  4: '4th — 2 Octaves',
  5: '5th — Major 3rd + 2 Oct',
  6: '6th — Perfect 5th + 2 Oct',
  7: '7th — Natural 7th',
  8: '8th — 3 Octaves',
  9: '9th — Major 2nd + 3 Oct',
  10: '10th — Major 3rd + 3 Oct',
  11: '11th — Tritone + 3 Oct',
  12: '12th — Perfect 5th + 3 Oct',
  13: '13th',
  14: '14th',
  15: '15th',
  16: '16th — 4 Octaves',
};

/** Well-known ratio labels for non-integer partials (from HARMONIC_SERIES) */
const RATIO_LABELS: Record<string, string> = {
  '0.236': '1/\u03C6\u00B3 (Golden Sub-Bass)',
  '0.25': '1/4 (2 Oct Down)',
  '0.382': '1/\u03C6\u00B2 (Golden Subharmonic)',
  '0.5': '1/2 (Oct Down)',
  '0.618': '1/\u03C6 (Golden Sub)',
  '0.75': '3/4 (P4 Down)',
  '1.333': '4/3 (Perfect 4th)',
  '1.414': '\u221A2 (Tritone)',
  '1.5': '3/2 (Perfect 5th)',
  '1.618': '\u03C6 (Golden Ratio)',
  '1.732': '\u221A3 (Sacred Triangle)',
  '2.236': '\u221A5 (Pentagonal)',
  '2.618': '\u03C6\u00B2 (Golden Squared)',
  '4.236': '\u03C6\u00B3 (Golden Cubed)',
};

export function getHarmonicLabel(n: number): string {
  if (HARMONIC_LABELS[n]) return HARMONIC_LABELS[n];
  // Check well-known ratios (match to 3 decimal places)
  const key = n.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  if (RATIO_LABELS[key]) return `${n}x \u2014 ${RATIO_LABELS[key]}`;
  // Generic label
  return Number.isInteger(n) ? `${n}th Harmonic` : `${n}x`;
}

// ─── Oscillator entry ───────────────────────────────────────────────

interface TrainerOscillator {
  oscillator: OscillatorNode;
  gain: GainNode;
}

// ─── Engine ─────────────────────────────────────────────────────────

export class OvertoneTrainer {
  private baseFrequency = 432;
  private timbre: TimbreType = 'sine';
  private volume = 0.35;
  private cycleDuration = 60;
  private maxHarmonic = 8;
  private profile: OvertoneProfile = OVERTONE_PROFILES[0];

  private oscillators: Map<number, TrainerOscillator> = new Map();
  private isRunning = false;
  private isExporting = false;
  private rafId: number | null = null;
  private cycleStartTime = 0;
  private onChange: (() => void) | null = null;

  // Step-based state machine
  private lastStep = -1;  // tracks which step we executed last to detect transitions
  private _phase: TrainerPhase = 'holding-bottom';
  private _currentHarmonic = 1;
  private _elapsed = 0;

  // Computed timing
  private fadeTime = 0;
  private holdTime = 0;

  /** Get the active harmonics list (capped by maxHarmonic for built-in profiles) */
  private getActiveHarmonics(): number[] {
    if (this.profile.name === CUSTOM_PROFILE_NAME) {
      // Custom profiles use all their harmonics (no maxHarmonic cap)
      return this.profile.harmonics;
    }
    return this.profile.harmonics.filter(h => h <= this.maxHarmonic);
  }

  /** Number of overtones to add/remove (excludes fundamental) */
  private getOvertoneCount(): number {
    return this.getActiveHarmonics().length - 1; // subtract the fundamental
  }

  setOnChange(cb: (() => void) | null): void {
    this.onChange = cb;
  }

  private computeTiming(): void {
    const overtoneCount = this.getOvertoneCount();
    if (overtoneCount <= 0) return;
    const steps = overtoneCount * 2; // up + down
    const fadeTotal = this.cycleDuration * 0.85;
    this.fadeTime = fadeTotal / steps;
    this.holdTime = this.cycleDuration * 0.075;
  }

  // ─── Start / Stop ─────────────────────────────────────────

  start(): void {
    if (this.isRunning) return;
    this.computeTiming();
    this.isRunning = true;
    this.lastStep = -1;
    this._phase = 'holding-bottom';
    this._currentHarmonic = 1;

    const context = audioEngine.getContext();
    this.cycleStartTime = context.currentTime;

    // Create the fundamental
    this.createOscillator(1, 0.8);

    this.tick();
  }

  stop(): void {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    this.destroyAllOscillators(0.5);
    this.onChange?.();
  }

  // ─── Tick (rAF loop) ─────────────────────────────────────

  private tick = (): void => {
    if (!this.isRunning) return;

    const context = audioEngine.getContext();
    const totalElapsed = context.currentTime - this.cycleStartTime;
    const cyclePos = totalElapsed % this.cycleDuration;
    this._elapsed = cyclePos;

    const harmonics = this.getActiveHarmonics();
    const overtoneCount = harmonics.length - 1;
    if (overtoneCount <= 0) {
      this.rafId = requestAnimationFrame(this.tick);
      return;
    }

    const ascendDuration = overtoneCount * this.fadeTime;
    const holdTopEnd = ascendDuration + this.holdTime;
    const descendDuration = overtoneCount * this.fadeTime;
    const descendEnd = holdTopEnd + descendDuration;

    // Determine current step as an integer
    let step: number;
    let phase: TrainerPhase;
    let currentHarmonic: number;

    if (cyclePos < ascendDuration) {
      const stepIndex = Math.floor(cyclePos / this.fadeTime);
      step = stepIndex; // 0..overtoneCount-1
      phase = 'ascending';
      currentHarmonic = harmonics[Math.min(stepIndex + 1, harmonics.length - 1)];
    } else if (cyclePos < holdTopEnd) {
      step = overtoneCount; // hold-top step
      phase = 'holding-top';
      currentHarmonic = harmonics[harmonics.length - 1];
    } else if (cyclePos < descendEnd) {
      const descElapsed = cyclePos - holdTopEnd;
      const stepIndex = Math.floor(descElapsed / this.fadeTime);
      step = overtoneCount + 1 + stepIndex; // unique step IDs for descending
      phase = 'descending';
      // Which harmonic to show as "current" — the one we just removed down to
      const removeIndex = harmonics.length - 1 - stepIndex;
      currentHarmonic = harmonics[Math.max(0, removeIndex - 1)];
    } else {
      step = overtoneCount * 2 + 1; // hold-bottom step
      phase = 'holding-bottom';
      currentHarmonic = 1;
    }

    // Only act on step transitions
    if (step !== this.lastStep) {
      if (phase === 'ascending') {
        const stepIndex = step;
        const harmonicNum = harmonics[stepIndex + 1];
        if (harmonicNum !== undefined) {
          this.createOscillator(harmonicNum, this.fadeTime * 0.85);
        }
      } else if (phase === 'descending') {
        const descStepIndex = step - overtoneCount - 1;
        const removeIndex = harmonics.length - 1 - descStepIndex;
        const harmonicNum = harmonics[removeIndex];
        if (harmonicNum !== undefined && harmonicNum !== 1) {
          this.destroyOscillator(harmonicNum, this.fadeTime * 0.85);
        }
      }
      this.lastStep = step;
    }

    // Detect cycle wrap — clean slate for next cycle
    if (totalElapsed >= this.cycleDuration && this.lastStep === overtoneCount * 2 + 1) {
      // Destroy everything except fundamental, then reset
      this.destroyAllExceptFundamental(0.2);
      this.cycleStartTime = context.currentTime;
      this.lastStep = -1;
    }

    // Notify UI
    if (phase !== this._phase || currentHarmonic !== this._currentHarmonic) {
      this._phase = phase;
      this._currentHarmonic = currentHarmonic;
    }
    this.onChange?.(); // always notify for elapsed time updates

    this.rafId = requestAnimationFrame(this.tick);
  };

  // ─── Oscillator management ────────────────────────────────

  private createOscillator(harmonicNum: number, fadeIn: number): void {
    // If already exists, skip
    if (this.oscillators.has(harmonicNum)) return;

    const context = audioEngine.getContext();
    const masterGain = audioEngine.getMasterGain();
    const now = context.currentTime;

    const osc = context.createOscillator();
    applyTimbre(osc, context, this.timbre);
    osc.frequency.value = this.baseFrequency * harmonicNum;

    const gain = context.createGain();
    const targetVol = this.volume * Math.min(1, 1.2 / Math.sqrt(harmonicNum));
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(targetVol, now + fadeIn);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);

    this.oscillators.set(harmonicNum, { oscillator: osc, gain });
  }

  private destroyOscillator(harmonicNum: number, fadeOut: number): void {
    const entry = this.oscillators.get(harmonicNum);
    if (!entry) return;

    // Remove from map IMMEDIATELY to prevent stacking
    this.oscillators.delete(harmonicNum);

    const context = audioEngine.getContext();
    const now = context.currentTime;

    entry.gain.gain.cancelScheduledValues(now);
    entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
    entry.gain.gain.linearRampToValueAtTime(0, now + fadeOut);
    entry.oscillator.stop(now + fadeOut + 0.1);

    // Disconnect after fade (fire-and-forget, no map dependency)
    setTimeout(() => {
      try { entry.oscillator.disconnect(); } catch { /* ok */ }
      try { entry.gain.disconnect(); } catch { /* ok */ }
    }, (fadeOut + 0.2) * 1000);
  }

  private destroyAllExceptFundamental(fadeOut: number): void {
    for (const [num] of Array.from(this.oscillators)) {
      if (num !== 1) {
        this.destroyOscillator(num, fadeOut);
      }
    }
  }

  private destroyAllOscillators(fadeOut: number): void {
    for (const [num] of Array.from(this.oscillators)) {
      this.destroyOscillator(num, fadeOut);
    }
  }

  // ─── State for UI ─────────────────────────────────────────

  getState(): OvertoneTrainerState {
    return {
      isRunning: this.isRunning,
      cycleDuration: this.cycleDuration,
      maxHarmonic: this.maxHarmonic,
      currentHarmonic: this._currentHarmonic,
      phase: this._phase,
      volume: this.volume,
      elapsed: this._elapsed,
      profileName: this.profile.name,
      isExporting: this.isExporting,
    };
  }

  /** Get the list of harmonic numbers active in current profile (capped by maxHarmonic) */
  getActiveHarmonicNumbers(): number[] {
    return this.getActiveHarmonics();
  }

  // ─── Setters ──────────────────────────────────────────────

  setCycleDuration(seconds: number): void {
    this.cycleDuration = Math.max(10, Math.min(120, seconds));
    this.computeTiming();
    this.onChange?.();
  }

  setMaxHarmonic(n: number): void {
    this.maxHarmonic = Math.max(2, Math.min(16, n));
    this.computeTiming();
    this.onChange?.();
  }

  setProfile(profile: OvertoneProfile): void {
    const wasRunning = this.isRunning;
    if (wasRunning) this.stop();
    this.profile = profile;
    this.computeTiming();
    this.onChange?.();
    if (wasRunning) this.start();
  }

  setBaseFrequency(freq: number): void {
    this.baseFrequency = freq;
    for (const [num, entry] of this.oscillators) {
      const context = audioEngine.getContext();
      const now = context.currentTime;
      entry.oscillator.frequency.cancelScheduledValues(now);
      entry.oscillator.frequency.setValueAtTime(entry.oscillator.frequency.value, now);
      entry.oscillator.frequency.linearRampToValueAtTime(freq * num, now + 0.1);
    }
  }

  setTimbre(timbre: TimbreType): void {
    this.timbre = timbre;
    if (this.oscillators.size > 0) {
      const context = audioEngine.getContext();
      for (const [, entry] of this.oscillators) {
        applyTimbre(entry.oscillator, context, timbre);
      }
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    for (const [num, entry] of this.oscillators) {
      const context = audioEngine.getContext();
      const now = context.currentTime;
      const targetVol = this.volume * Math.min(1, 1.2 / Math.sqrt(num));
      entry.gain.gain.cancelScheduledValues(now);
      entry.gain.gain.setValueAtTime(entry.gain.gain.value, now);
      entry.gain.gain.linearRampToValueAtTime(targetVol, now + 0.1);
    }
    this.onChange?.();
  }

  // ─── Offline Export ───────────────────────────────────────

  /**
   * Render one full ascending+descending cycle as a WAV-ready AudioBuffer.
   * Uses OfflineAudioContext — no real-time playback required.
   */
  async exportCycle(sampleRate: number = 48000): Promise<AudioBuffer> {
    this.isExporting = true;
    this.onChange?.();

    try {
      const harmonics = this.getActiveHarmonics();
      const overtoneCount = harmonics.length - 1;
      if (overtoneCount <= 0) throw new Error('No overtones to export');

      this.computeTiming();
      const totalSamples = Math.round(this.cycleDuration * sampleRate);
      const offline = new OfflineAudioContext(2, totalSamples, sampleRate);

      const masterGain = offline.createGain();
      masterGain.gain.value = 0.7;
      masterGain.connect(offline.destination);

      const ascendDuration = overtoneCount * this.fadeTime;
      const holdTopEnd = ascendDuration + this.holdTime;

      // Create fundamental — plays entire duration
      this.scheduleOfflineOscillator(offline, masterGain, 1, 0, this.cycleDuration, 0.8, 0.5);

      // Schedule each overtone: fade in during ascending, fade out during descending
      for (let i = 0; i < overtoneCount; i++) {
        const harmonicNum = harmonics[i + 1];
        const fadeInStart = i * this.fadeTime;
        const fadeInDuration = this.fadeTime * 0.85;

        // Descending: reverse order
        const descStepIndex = overtoneCount - 1 - i;
        const fadeOutStart = holdTopEnd + descStepIndex * this.fadeTime;
        const fadeOutDuration = this.fadeTime * 0.85;

        this.scheduleOfflineOscillator(
          offline, masterGain, harmonicNum,
          fadeInStart, fadeOutStart + fadeOutDuration + 0.1,
          fadeInDuration, fadeOutDuration,
        );
      }

      const buffer = await offline.startRendering();
      return buffer;
    } finally {
      this.isExporting = false;
      this.onChange?.();
    }
  }

  private scheduleOfflineOscillator(
    ctx: OfflineAudioContext,
    masterGain: GainNode,
    harmonicNum: number,
    startTime: number,
    endTime: number,
    fadeIn: number,
    fadeOut: number,
  ): void {
    const osc = ctx.createOscillator();
    applyTimbre(osc, ctx, this.timbre);
    osc.frequency.value = this.baseFrequency * harmonicNum;

    const gain = ctx.createGain();
    const targetVol = this.volume * Math.min(1, 1.2 / Math.sqrt(harmonicNum));

    // Fade in
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(targetVol, startTime + fadeIn);

    // Hold
    gain.gain.setValueAtTime(targetVol, endTime - fadeOut);

    // Fade out
    gain.gain.linearRampToValueAtTime(0, endTime);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(startTime);
    osc.stop(endTime + 0.05);
  }
}
