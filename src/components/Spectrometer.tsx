/**
 * Real-time frequency spectrometer showing FFT frequency bands
 * with peak frequency labels
 */

import { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';

interface SpectrometerProps {
  isPlaying: boolean;
  frequency: number;
}

interface Peak {
  freq: number;
  amplitude: number;
  x: number;
  y: number;
}

export function Spectrometer({ isPlaying, frequency }: SpectrometerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isPlaying || !isExpanded) {
      cancelAnimationFrame(animationRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      return;
    }

    let analyser: AnalyserNode;
    try {
      analyser = audioEngine.getAnalyser();
    } catch {
      return;
    }

    analyser.fftSize = 4096;
    analyser.smoothingTimeConstant = 0.85;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const sampleRate = audioEngine.getSampleRate();
    const binWidth = sampleRate / (bufferLength * 2);

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * 2 || canvas.height !== rect.height * 2) {
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
      }

      const width = rect.width;
      const height = rect.height;

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(10, 10, 15, 0.6)';
      ctx.fillRect(0, 0, width, height);

      // Logarithmic frequency mapping
      const minFreq = 20;
      const maxFreq = 20000;
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      const barCount = Math.min(120, Math.floor(width / 3));

      // Collect bar data for peak detection
      const bars: Array<{ freq: number; value: number; x: number }> = [];

      for (let i = 0; i < barCount; i++) {
        const logFreq = logMin + (i / barCount) * (logMax - logMin);
        const freq = Math.pow(10, logFreq);
        const bin = Math.round((freq / sampleRate) * bufferLength * 2);
        if (bin >= bufferLength) continue;

        let value = 0;
        let count = 0;
        const spread = Math.max(1, Math.floor(bin * 0.05));
        for (let j = Math.max(0, bin - spread); j <= Math.min(bufferLength - 1, bin + spread); j++) {
          value += dataArray[j];
          count++;
        }
        value = value / count / 255;

        const barWidth = Math.max(1, (width / barCount) - 1);
        const barHeight = value * (height - 24);
        const x = (i / barCount) * width;
        const y = height - barHeight;

        const r = Math.floor(200 + value * 55);
        const g = Math.floor(150 * value + 50);
        const b = Math.floor(20 + value * 30);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + value * 0.4})`;
        ctx.fillRect(x, y, barWidth, barHeight);

        bars.push({ freq, value, x: x + barWidth / 2 });
      }

      // Detect peaks: local maxima above threshold, minimum spacing
      const peaks: Peak[] = [];
      const peakThreshold = 0.15;
      const minPeakSpacing = 50; // pixels

      for (let i = 2; i < bars.length - 2; i++) {
        const v = bars[i].value;
        if (v < peakThreshold) continue;
        if (v > bars[i - 1].value && v > bars[i + 1].value &&
            v > bars[i - 2].value && v > bars[i + 2].value) {
          // Find the actual FFT bin peak for more accurate frequency
          const bin = Math.round((bars[i].freq / sampleRate) * bufferLength * 2);
          let peakBin = bin;
          let peakVal = dataArray[bin] || 0;
          for (let j = Math.max(0, bin - 3); j <= Math.min(bufferLength - 1, bin + 3); j++) {
            if (dataArray[j] > peakVal) {
              peakVal = dataArray[j];
              peakBin = j;
            }
          }
          const preciseFreq = peakBin * binWidth;
          const barHeight = v * (height - 24);

          // Check minimum spacing from existing peaks
          const tooClose = peaks.some((p) => Math.abs(p.x - bars[i].x) < minPeakSpacing);
          if (!tooClose) {
            peaks.push({
              freq: preciseFreq,
              amplitude: v,
              x: bars[i].x,
              y: height - barHeight,
            });
          }
        }
      }

      // Sort by amplitude, keep top 8
      peaks.sort((a, b) => b.amplitude - a.amplitude);
      const topPeaks = peaks.slice(0, 8);

      // Draw peak labels
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      topPeaks.forEach((peak) => {
        const label = peak.freq >= 1000
          ? `${(peak.freq / 1000).toFixed(1)}k`
          : `${Math.round(peak.freq)}`;

        // Small dot at peak
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(peak.x, peak.y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Label above peak
        const labelY = Math.max(18, peak.y - 6);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText(label, peak.x, labelY);
      });

      // Draw fundamental frequency marker
      if (frequency > 0) {
        const logF = Math.log10(frequency);
        const markerX = ((logF - logMin) / (logMax - logMin)) * width;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(markerX, 0);
        ctx.lineTo(markerX, height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Frequency axis labels
      const labelFreqs = [50, 100, 200, 500, 1000, 2000, 5000, 10000];
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '9px Inter, sans-serif';
      ctx.textAlign = 'center';
      labelFreqs.forEach((f) => {
        const logF = Math.log10(f);
        const x = ((logF - logMin) / (logMax - logMin)) * width;
        const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
        ctx.fillText(label, x, height - 2);
      });

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, isExpanded, frequency]);

  return (
    <div className="glass-card overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <h2 className="text-lg font-display">Spectrometer</h2>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-6 pb-4">
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg"
            style={{ height: '150px' }}
          />
          {!isPlaying && (
            <div className="text-xs text-gray-500 text-center mt-2">
              Start playing to see frequency analysis
            </div>
          )}
        </div>
      )}
    </div>
  );
}
