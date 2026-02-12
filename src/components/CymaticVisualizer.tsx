/**
 * Cymatic visualizer component with mode toggle
 */

import { useEffect, useRef, useState } from 'react';
import { ChladniRenderer } from '../visualizer/chladniRenderer';
import { audioEngine } from '../audio/AudioEngine';

interface CymaticVisualizerProps {
  isPlaying: boolean;
  frequency: number;
  onShareClick?: () => void;
}

export function CymaticVisualizer({
  isPlaying,
  frequency,
  onShareClick,
}: CymaticVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<ChladniRenderer | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [mode, setMode] = useState<'cymatic' | 'wave' | 'geometry'>('cymatic');

  // Initialize renderer
  useEffect(() => {
    const patternCanvas = patternCanvasRef.current;
    const particleCanvas = particleCanvasRef.current;

    if (!patternCanvas || !particleCanvas) return;

    // Set canvas size
    const size = Math.min(window.innerWidth - 40, 600);
    patternCanvas.width = size;
    patternCanvas.height = size;
    particleCanvas.width = size;
    particleCanvas.height = size;

    // Create renderer
    rendererRef.current = new ChladniRenderer({
      canvas: patternCanvas,
      particleCanvas: particleCanvas,
      useWebGL: true,
      particleCount: 5000,
    });

    // Set initial frequency
    rendererRef.current.updateFrequency(frequency);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      rendererRef.current?.destroy();
    };
  }, []);

  // Update frequency
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.updateFrequency(frequency);
    }
  }, [frequency]);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      if (rendererRef.current) {
        // Get amplitude from audio engine
        const amplitude = isPlaying && audioEngine.isReady()
          ? audioEngine.getAmplitude()
          : 0.3; // Default amplitude when not playing

        rendererRef.current.setAmplitude(amplitude);
        rendererRef.current.render(timestamp);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(window.innerWidth - 40, 600);
      if (rendererRef.current) {
        rendererRef.current.resize(size, size);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="relative mb-8">
      {/* Canvas container */}
      <div className="relative mx-auto" style={{ maxWidth: '600px', width: '100%', aspectRatio: '1/1' }}>
        {/* Pattern canvas (WebGL layer) */}
        <canvas
          ref={patternCanvasRef}
          className="absolute top-0 left-0 w-full h-full rounded-3xl"
          style={{ backgroundColor: '#0a0a0f' }}
        />

        {/* Particle canvas (overlay) */}
        <canvas
          ref={particleCanvasRef}
          className="absolute top-0 left-0 w-full h-full rounded-3xl"
        />

        {/* Share button */}
        {onShareClick && (
          <button
            onClick={onShareClick}
            className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all"
            aria-label="Share visualization"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
          </button>
        )}

        {/* Frequency display overlay */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
          <div className="text-center">
            <div className="text-3xl font-display font-semibold text-accent-gold">
              {frequency.toFixed(0)} Hz
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {isPlaying ? 'Playing' : 'Paused'}
            </div>
          </div>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex justify-center gap-2 mt-6">
        <button
          onClick={() => setMode('cymatic')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'cymatic'
              ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
              : 'bg-white/10 hover:bg-white/20 border border-white/20'
          }`}
        >
          Cymatic Particles
        </button>
        <button
          onClick={() => setMode('wave')}
          disabled
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 opacity-50 cursor-not-allowed"
        >
          Wave Interference
        </button>
        <button
          onClick={() => setMode('geometry')}
          disabled
          className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 border border-white/10 opacity-50 cursor-not-allowed"
        >
          Sacred Geometry
        </button>
      </div>

      <div className="text-center text-sm text-gray-500 mt-2">
        More modes coming soon
      </div>
    </div>
  );
}
