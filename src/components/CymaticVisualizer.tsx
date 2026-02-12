/**
 * Cymatic visualizer component with mode toggle
 */

import { useEffect, useRef, useState } from 'react';
import { ChladniRenderer } from '../visualizer/chladniRenderer';
import { WaveRenderer } from '../visualizer/waveRenderer';
import { GeometryRenderer } from '../visualizer/geometryRenderer';
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
  const chladniRendererRef = useRef<ChladniRenderer | null>(null);
  const waveRendererRef = useRef<WaveRenderer | null>(null);
  const geometryRendererRef = useRef<GeometryRenderer | null>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [mode, setMode] = useState<'cymatic' | 'wave' | 'geometry'>('cymatic');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen toggle
  const handleFullscreenToggle = async () => {
    try {
      if (!isFullscreen) {
        // Enter fullscreen
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  // Listen for fullscreen changes (user can exit with ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Initialize renderers
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

    // Create all renderers
    chladniRendererRef.current = new ChladniRenderer({
      canvas: patternCanvas,
      particleCanvas: particleCanvas,
      useWebGL: true,
      particleCount: 5000,
    });

    waveRendererRef.current = new WaveRenderer({
      canvas: patternCanvas,
      particleCanvas: particleCanvas,
      sourceCount: 3,
    });

    geometryRendererRef.current = new GeometryRenderer({
      canvas: patternCanvas,
      particleCanvas: particleCanvas,
    });

    // Set initial frequency for all renderers
    chladniRendererRef.current.updateFrequency(frequency);
    waveRendererRef.current.updateFrequency(frequency);
    geometryRendererRef.current.updateFrequency(frequency);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      chladniRendererRef.current?.destroy();
      waveRendererRef.current?.destroy();
      geometryRendererRef.current?.destroy();
    };
  }, []);

  // Update frequency for all renderers
  useEffect(() => {
    chladniRendererRef.current?.updateFrequency(frequency);
    waveRendererRef.current?.updateFrequency(frequency);
    geometryRendererRef.current?.updateFrequency(frequency);
  }, [frequency]);

  // Animation loop
  useEffect(() => {
    const animate = (timestamp: number) => {
      // Get amplitude from audio engine
      const amplitude = isPlaying && audioEngine.isReady()
        ? audioEngine.getAmplitude()
        : 0.3; // Default amplitude when not playing

      // Render based on current mode
      switch (mode) {
        case 'cymatic':
          if (chladniRendererRef.current) {
            chladniRendererRef.current.setAmplitude(amplitude);
            chladniRendererRef.current.render(timestamp);
          }
          break;
        case 'wave':
          if (waveRendererRef.current) {
            waveRendererRef.current.setAmplitude(amplitude);
            waveRendererRef.current.render(timestamp);
          }
          break;
        case 'geometry':
          if (geometryRendererRef.current) {
            geometryRendererRef.current.setAmplitude(amplitude);
            geometryRendererRef.current.render(timestamp);
          }
          break;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, mode]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(window.innerWidth - 40, 600);
      chladniRendererRef.current?.resize(size, size);
      waveRendererRef.current?.resize(size, size);
      geometryRendererRef.current?.resize(size, size);
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

        {/* Control buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {/* Fullscreen button */}
          <button
            onClick={handleFullscreenToggle}
            className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all"
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isFullscreen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              )}
            </svg>
          </button>

          {/* Share button */}
          {onShareClick && (
            <button
              onClick={onShareClick}
              className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 hover:bg-white/20 transition-all"
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
        </div>

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

      {/* Mode selector (hidden in fullscreen) */}
      {!isFullscreen && (
        <>
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'wave'
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20'
              }`}
            >
              Wave Interference
            </button>
            <button
              onClick={() => setMode('geometry')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'geometry'
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20'
              }`}
            >
              Sacred Geometry
            </button>
          </div>

          <div className="text-center text-sm text-gray-500 mt-2">
            Switch between visualization modes
          </div>
        </>
      )}
    </div>
  );
}
