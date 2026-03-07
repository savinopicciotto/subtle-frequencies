/**
 * Real-time frequency spectrometer showing FFT frequency bands
 */

import { useRef, useEffect, useState } from 'react';
import { audioEngine } from '../audio/AudioEngine';

interface SpectrometerProps {
  isPlaying: boolean;
  frequency: number;
}

export function Spectrometer({ isPlaying, frequency }: SpectrometerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isPlaying || !isExpanded) {
      cancelAnimationFrame(animationRef.current);
      // Clear canvas when not playing
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

    // Use higher FFT for better frequency resolution
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const sampleRate = audioEngine.getSampleRate();

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Match canvas resolution to display size
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width * 2 || canvas.height !== rect.height * 2) {
        canvas.width = rect.width * 2;
        canvas.height = rect.height * 2;
        ctx.scale(2, 2);
      }

      const width = rect.width;
      const height = rect.height;

      analyser.getByteFrequencyData(dataArray);

      // Clear
      ctx.clearRect(0, 0, width, height);

      // Background
      ctx.fillStyle = 'rgba(10, 10, 15, 0.6)';
      ctx.fillRect(0, 0, width, height);

      // Draw frequency bars (logarithmic scale, 20Hz - 20kHz)
      const minFreq = 20;
      const maxFreq = 20000;
      const logMin = Math.log10(minFreq);
      const logMax = Math.log10(maxFreq);
      const barCount = Math.min(120, Math.floor(width / 3));

      for (let i = 0; i < barCount; i++) {
        // Map bar index to frequency (logarithmic)
        const logFreq = logMin + (i / barCount) * (logMax - logMin);
        const freq = Math.pow(10, logFreq);

        // Map frequency to FFT bin
        const bin = Math.round((freq / sampleRate) * bufferLength * 2);
        if (bin >= bufferLength) continue;

        // Average a few bins for smoother display
        let value = 0;
        let count = 0;
        const spread = Math.max(1, Math.floor(bin * 0.05));
        for (let j = Math.max(0, bin - spread); j <= Math.min(bufferLength - 1, bin + spread); j++) {
          value += dataArray[j];
          count++;
        }
        value = value / count / 255;

        const barWidth = Math.max(1, (width / barCount) - 1);
        const barHeight = value * (height - 20);
        const x = (i / barCount) * width;
        const y = height - barHeight;

        // Color: amber gradient based on amplitude
        const r = Math.floor(200 + value * 55);
        const g = Math.floor(150 * value + 50);
        const b = Math.floor(20 + value * 30);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + value * 0.4})`;
        ctx.fillRect(x, y, barWidth, barHeight);
      }

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

        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(frequency)}Hz`, markerX, 10);
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
            style={{ height: '120px' }}
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
