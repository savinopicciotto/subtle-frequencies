/**
 * Overtone Trainer UI — ear training tool that automatically introduces
 * and strips harmonics one at a time on a configurable cycle.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  OvertoneTrainer as OvertoneTrainerEngine,
  OVERTONE_PROFILES,
  CUSTOM_PROFILE_NAME,
  buildCustomProfile,
  getHarmonicLabel,
} from '../audio/overtoneTrainer';
import { encodeWAV } from '../audio/audioExport';

interface HarmonicLayerInfo {
  ratio: number;
  muted: boolean;
}

interface OvertoneTrainerProps {
  engine: OvertoneTrainerEngine;
  isPlaying: boolean;
  frequency: number;
  harmonicLayers: HarmonicLayerInfo[];
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function OvertoneTrainer({ engine, isPlaying, frequency, harmonicLayers }: OvertoneTrainerProps) {
  const [state, setState] = useState(engine.getState());
  const [expanded, setExpanded] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // Subscribe to engine state changes
  useEffect(() => {
    const update = () => setState(engine.getState());
    engine.setOnChange(update);
    return () => engine.setOnChange(null);
  }, [engine]);

  // Sync base frequency
  useEffect(() => {
    engine.setBaseFrequency(frequency);
  }, [engine, frequency]);

  // Stop trainer when main playback stops
  useEffect(() => {
    if (!isPlaying && state.isRunning) {
      engine.stop();
    }
  }, [isPlaying, state.isRunning, engine]);

  const handleToggle = useCallback(() => {
    if (state.isRunning) {
      engine.stop();
    } else {
      if (!isPlaying) return;
      engine.start();
    }
  }, [engine, state.isRunning, isPlaying]);

  const handleExport = useCallback(async () => {
    try {
      const buffer = await engine.exportCycle();
      const blob = encodeWAV(buffer);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `overtone-trainer_${Math.round(frequency)}Hz_${state.cycleDuration}s.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [engine, frequency, state.cycleDuration]);

  const handleCustomProfile = useCallback(() => {
    const profile = buildCustomProfile(harmonicLayers);
    if (profile) {
      engine.setProfile(profile);
    }
  }, [engine, harmonicLayers]);

  const customProfile = buildCustomProfile(harmonicLayers);
  const hasCustomLayers = customProfile !== null;

  const phaseLabel = {
    ascending: 'Revealing',
    'holding-top': 'Full Stack',
    descending: 'Stripping',
    'holding-bottom': 'Fundamental',
  }[state.phase];

  // Build harmonic indicator dots from actual profile
  const activeHarmonics = engine.getActiveHarmonicNumbers();
  const dots = activeHarmonics.map((h) => {
    const isActive =
      state.isRunning &&
      (state.phase === 'holding-top' ||
        (state.phase === 'ascending' && activeHarmonics.indexOf(h) <= activeHarmonics.indexOf(state.currentHarmonic)) ||
        (state.phase === 'descending' && activeHarmonics.indexOf(h) <= activeHarmonics.indexOf(state.currentHarmonic)) ||
        (state.phase === 'holding-bottom' && h === 1));
    return (
      <div
        key={h}
        className={`w-3 h-3 rounded-full transition-all duration-500 ${
          isActive
            ? 'bg-gradient-to-br from-accent-gold to-accent-amber scale-110 shadow-[0_0_6px_rgba(245,166,35,0.5)]'
            : 'bg-white/10 scale-100'
        }`}
        title={getHarmonicLabel(h)}
      />
    );
  });

  // Progress bar percentage
  const progress = state.isRunning ? (state.elapsed / state.cycleDuration) * 100 : 0;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display">Overtone Trainer</h2>
          <p className="text-sm text-gray-400 mt-1">
            Ear training — harmonics revealed &amp; stripped automatically
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAbout(!showAbout)}
            className="px-3 py-2 text-sm text-gray-400 hover:text-white bg-white/5 border border-white/10 rounded-lg transition-colors"
            title="About overtones"
          >
            ?
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={!isPlaying && !state.isRunning}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              state.isRunning
                ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                : !isPlaying
                  ? 'bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed'
                  : 'bg-white/10 border border-white/20 hover:bg-white/15'
            }`}
          >
            {state.isRunning ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      {!isPlaying && !state.isRunning && (
        <div className="text-xs text-gray-500">Press play on the main frequency first.</div>
      )}

      {/* About / Educational Section */}
      {showAbout && (
        <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10 text-sm text-gray-300 leading-relaxed">
          <div>
            <h3 className="font-display text-lg text-white mb-2">What Are Overtones?</h3>
            <p>
              Every musical sound is actually a stack of frequencies. When you pluck a guitar
              string tuned to 100 Hz, you don't just hear 100 Hz — you also hear 200 Hz,
              300 Hz, 400 Hz, and so on, all at once. These are <strong className="text-accent-gold">overtones</strong> (or
              harmonics), and they're what give each instrument its unique character.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg text-white mb-2">The Natural Harmonic Series</h3>
            <p>
              The natural harmonic series follows a simple pattern: integer multiples of the
              fundamental frequency. The 2nd harmonic is an octave above, the 3rd is a perfect
              fifth above that, the 4th is another octave, and so on. This is the basis of all
              harmony in music — the notes that "sound good together" are related by these
              simple whole-number ratios.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg text-white mb-2">Profiles &amp; What They Teach</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">Natural Series</strong> — The complete overtone series as
                found in strings and voice. The foundation of ear training.
              </div>
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">Odd Harmonics</strong> — Only odd-numbered partials (1, 3, 5, 7...).
                This is what clarinets and closed organ pipes naturally produce — the tube is closed at one end,
                canceling even harmonics. Creates a hollow, woody tone.
              </div>
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">Even Harmonics</strong> — Emphasizes octave relationships.
                Warm and full, similar to open strings and flutes.
              </div>
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">Perfect Intervals</strong> — Only octaves and fifths (2, 3, 4, 6, 8, 12).
                These are the most consonant intervals — the ones humans across all cultures tend to agree
                "sound good." The basis of Pythagorean tuning.
              </div>
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">Prime Harmonics</strong> — Only prime-numbered partials
                (2, 3, 5, 7, 11, 13). Each prime introduces a genuinely new interval that can't be derived
                from lower harmonics. Sparse and distinctive.
              </div>
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">Power of Two</strong> — Pure octave stacking (1, 2, 4, 8, 16).
                Learn to hear the same pitch class across four octaves.
              </div>
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">Low &amp; Dense</strong> — Just the first five harmonics
                clustered together. The intervals are wide and easy to identify — great for beginners.
              </div>
              <div className="p-2 bg-white/5 rounded">
                <strong className="text-gray-200">From Harmonic Layers</strong> — Uses whatever ratios you've
                configured in the Harmonic Layers section above. These may include non-natural intervals
                like the golden ratio (1.618x) or solfeggio ratios — designed sounds rather than acoustic
                phenomena. Useful for learning to recognize custom interval stacks.
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-display text-lg text-white mb-2">Natural vs. Designed Intervals</h3>
            <p>
              The profiles above (Natural Series through Low &amp; Dense) all use <strong className="text-accent-gold">natural
              overtones</strong> — integer multiples of the fundamental that occur in acoustic physics. These
              are the sounds that vibrating strings, air columns, and membranes produce.
            </p>
            <p className="mt-2">
              By contrast, the Harmonic Layers section includes mathematical and mystical intervals like
              the golden ratio (&#x3C6; = 1.618x), solfeggio frequency ratios, &#x221A;2 (the tritone), and
              &#x221A;3 (the sacred triangle). These don't appear as overtones in nature — they're human
              constructions with their own aesthetic and spiritual significance.
            </p>
          </div>

          <div>
            <h3 className="font-display text-lg text-white mb-2">Other Natural Patterns</h3>
            <p>
              Not all acoustic instruments follow the simple 1, 2, 3... series:
            </p>
            <ul className="list-disc list-inside mt-1 space-y-1 text-xs text-gray-400">
              <li>
                <strong className="text-gray-300">Bells &amp; singing bowls</strong> produce inharmonic
                partials at non-integer ratios (e.g., 2.71x, 4.83x) — determined by plate
                and shell vibration physics, not string physics.
              </li>
              <li>
                <strong className="text-gray-300">Piano strings</strong> have slightly stretched harmonics
                due to string stiffness (the 2nd partial might be at 2.01x instead of exactly 2x).
              </li>
              <li>
                <strong className="text-gray-300">Throat singing</strong> (Tuvan, Mongolian) can produce
                subharmonics — frequencies below the fundamental (0.5x, 0.25x).
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-display text-lg text-white mb-2">How to Practice</h3>
            <ol className="list-decimal list-inside space-y-1 text-xs text-gray-400">
              <li>Start with <strong className="text-gray-300">Natural Series</strong> and a slow cycle (60s).</li>
              <li>Close your eyes. As each harmonic fades in, try to identify the interval before looking.</li>
              <li>The label shows what you're hearing — check your guess.</li>
              <li>Once you can identify harmonics 2–5 consistently, try <strong className="text-gray-300">Odd Harmonics</strong> or <strong className="text-gray-300">Prime Harmonics</strong>.</li>
              <li>Speed up the cycle as your ear improves.</li>
              <li>Export cycles as WAV files to practice offline or use in your DAW.</li>
            </ol>
          </div>

          <button
            type="button"
            onClick={() => setShowAbout(false)}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* Running state display */}
      {state.isRunning && (
        <div className="space-y-3">
          {/* Harmonic dots */}
          <div className="flex items-center gap-1.5 justify-center flex-wrap">
            {dots}
          </div>

          {/* Current harmonic label */}
          <div className="text-center">
            <div className="text-lg font-display text-accent-gold">
              {getHarmonicLabel(state.currentHarmonic)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{phaseLabel}</div>
          </div>

          {/* Progress bar + elapsed time */}
          <div className="space-y-1">
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-gold to-accent-amber transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTime(state.elapsed)}</span>
              <span>{formatTime(state.cycleDuration)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Settings toggle */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-sm text-gray-400 hover:text-white transition-colors"
      >
        {expanded ? 'Hide settings' : 'Settings'}
      </button>

      {expanded && (
        <div className="space-y-4 pt-2">
          {/* Overtone Profile */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Overtone Profile
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OVERTONE_PROFILES.map((profile) => (
                <button
                  type="button"
                  key={profile.name}
                  onClick={() => engine.setProfile(profile)}
                  className={`p-2.5 rounded-lg text-left transition-all ${
                    state.profileName === profile.name
                      ? 'bg-gradient-to-r from-accent-gold/20 to-accent-amber/20 border border-accent-gold/50'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className={`text-sm font-medium ${state.profileName === profile.name ? 'text-accent-gold' : 'text-gray-200'}`}>
                    {profile.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{profile.description}</div>
                </button>
              ))}

              {/* From Harmonic Layers — dynamic profile */}
              <button
                type="button"
                onClick={handleCustomProfile}
                disabled={!hasCustomLayers}
                className={`p-2.5 rounded-lg text-left transition-all ${
                  state.profileName === CUSTOM_PROFILE_NAME
                    ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/50'
                    : hasCustomLayers
                      ? 'bg-white/5 border border-white/10 hover:bg-white/10'
                      : 'bg-white/5 border border-white/10 opacity-40 cursor-not-allowed'
                }`}
              >
                <div className={`text-sm font-medium ${state.profileName === CUSTOM_PROFILE_NAME ? 'text-purple-400' : hasCustomLayers ? 'text-gray-200' : 'text-gray-500'}`}>
                  From Harmonic Layers
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {hasCustomLayers
                    ? `${customProfile!.harmonics.length - 1} layers — your custom intervals`
                    : 'Add layers above first'}
                </div>
              </button>
            </div>
          </div>

          {/* Cycle duration */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Cycle Duration: {state.cycleDuration}s
            </label>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={state.cycleDuration}
              onChange={(e) => engine.setCycleDuration(parseInt(e.target.value))}
              className="slider w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>15s</span>
              <span>120s</span>
            </div>
          </div>

          {/* Max harmonic — hide for custom profiles since it doesn't apply */}
          {state.profileName !== CUSTOM_PROFILE_NAME && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Highest Harmonic: {state.maxHarmonic}
              </label>
              <input
                type="range"
                min="2"
                max="16"
                step="1"
                value={state.maxHarmonic}
                onChange={(e) => engine.setMaxHarmonic(parseInt(e.target.value))}
                className="slider w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>2nd</span>
                <span>16th</span>
              </div>
            </div>
          )}

          {/* Volume */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Volume: {Math.round(state.volume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={state.volume}
              onChange={(e) => engine.setVolume(parseFloat(e.target.value))}
              title="Trainer volume"
              className="slider w-full"
            />
          </div>

          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            disabled={state.isExporting}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium hover:bg-white/15 transition-all disabled:opacity-50 disabled:cursor-wait"
          >
            {state.isExporting ? 'Exporting...' : 'Export Full Cycle as WAV'}
          </button>
        </div>
      )}
    </div>
  );
}
