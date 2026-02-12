/**
 * Circular visualizer component that reacts to audio playback
 */

import { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  frequency: number;
}

export function Visualizer({ isPlaying, frequency }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const size = Math.min(window.innerWidth - 40, 400);
    canvas.width = size;
    canvas.height = size;

    let time = 0;

    const draw = () => {
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = Math.min(canvas.width, canvas.height) * 0.3;

      // Clear canvas
      ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (isPlaying) {
        time += 0.01;

        // Map frequency to color (lower = warmer, higher = cooler)
        const hue = Math.min(360, Math.max(0, (frequency - 100) / 900 * 200 + 20));
        const saturation = 70;
        const lightness = 50;

        // Breathing animation based on frequency
        const breathSpeed = (frequency / 1000) * 0.5 + 0.2;
        const breathAmount = Math.sin(time * breathSpeed) * 0.15 + 1;
        const radius = baseRadius * breathAmount;

        // Draw main circle
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          radius * 0.3,
          centerX,
          centerY,
          radius
        );
        gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.8)`);
        gradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness - 20}%, 0)`);

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw outer rings
        for (let i = 0; i < 3; i++) {
          const ringRadius = radius + (i + 1) * 20 + Math.sin(time + i) * 5;
          const ringOpacity = 0.3 - i * 0.1;

          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${ringOpacity})`;
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw inner glow
        const innerGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius * 0.5
        );
        innerGradient.addColorStop(0, `hsla(${hue}, 100%, 80%, 0.6)`);
        innerGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = innerGradient;
        ctx.fill();
      } else {
        // Idle state - subtle pulsing
        time += 0.005;
        const pulseAmount = Math.sin(time) * 0.05 + 1;
        const radius = baseRadius * 0.6 * pulseAmount;

        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          radius * 0.3,
          centerX,
          centerY,
          radius
        );
        gradient.addColorStop(0, 'hsla(45, 60%, 50%, 0.3)');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frequency]);

  return (
    <div className="flex items-center justify-center mb-8">
      <canvas
        ref={canvasRef}
        className="rounded-full"
        style={{ maxWidth: '400px', width: '100%', height: 'auto' }}
      />
    </div>
  );
}
