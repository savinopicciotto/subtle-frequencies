/**
 * Export modal for PNG, GIF, and video export with watermarking
 */

import { useState, useRef } from 'react';
import GIF from 'gif.js';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  frequency: number;
  isPlaying: boolean;
}

type ExportFormat = 'png' | 'gif' | 'video';

export function ExportModal({
  isOpen,
  onClose,
  frequency,
  isPlaying,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [watermark, setWatermark] = useState(true);
  const [duration, setDuration] = useState(3); // For GIF/video
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  if (!isOpen) return null;

  /**
   * Add watermark to canvas
   */
  const addWatermarkToCanvas = (canvas: HTMLCanvasElement): HTMLCanvasElement => {
    const watermarkedCanvas = document.createElement('canvas');
    watermarkedCanvas.width = canvas.width;
    watermarkedCanvas.height = canvas.height;
    const ctx = watermarkedCanvas.getContext('2d');
    if (!ctx) return canvas;

    // Draw original canvas
    ctx.drawImage(canvas, 0, 0);

    if (watermark) {
      // Add watermark text
      const fontSize = Math.max(16, canvas.width / 30);
      ctx.font = `${fontSize}px Inter, sans-serif`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';

      const text = 'SubtleFrequencies.com';
      const padding = fontSize * 0.8;
      ctx.fillText(text, canvas.width / 2, canvas.height - padding);
    }

    return watermarkedCanvas;
  };

  /**
   * Export as PNG
   */
  const exportPNG = async () => {
    try {
      setIsExporting(true);
      setExportProgress(30);

      // Find the visualizer canvases
      const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas');
      if (canvases.length === 0) {
        throw new Error('No visualization to export');
      }

      // Create a temporary canvas to composite both layers
      const tempCanvas = document.createElement('canvas');
      const firstCanvas = canvases[0];
      tempCanvas.width = firstCanvas.width;
      tempCanvas.height = firstCanvas.height;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Draw both canvases (pattern + particles)
      canvases.forEach((canvas) => {
        ctx.drawImage(canvas, 0, 0);
      });

      setExportProgress(60);

      // Add watermark
      const finalCanvas = addWatermarkToCanvas(tempCanvas);

      setExportProgress(80);

      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        finalCanvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/png');
      });

      const filename = `subtle-frequencies-${frequency}Hz-${Date.now()}.png`;

      setExportProgress(100);

      // Try Web Share API first (mobile-friendly)
      if (
        navigator.share &&
        navigator.canShare?.({
          files: [new File([blob], filename, { type: 'image/png' })],
        })
      ) {
        await navigator.share({
          files: [new File([blob], filename, { type: 'image/png' })],
          title: 'Subtle Frequencies Visualization',
          text: `${frequency} Hz cymatic pattern`,
        });
      } else {
        // Fallback: Download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
      }

      onClose();
    } catch (error) {
      console.error('Failed to export PNG:', error);
      alert('Failed to export PNG. Please try again.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  /**
   * Export as GIF
   */
  const exportGIF = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      if (!isPlaying) {
        alert('Please start playing audio before exporting GIF');
        setIsExporting(false);
        return;
      }

      // Find the visualizer canvases
      const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas');
      if (canvases.length === 0) {
        throw new Error('No visualization to export');
      }

      const firstCanvas = canvases[0];
      const width = firstCanvas.width;
      const height = firstCanvas.height;

      // Initialize GIF encoder
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width,
        height,
        workerScript: '/gif.worker.js', // We'll need to copy this to public/
      });

      // Capture frames
      const fps = 30;
      const totalFrames = duration * fps;
      const frameInterval = 1000 / fps;

      for (let i = 0; i < totalFrames; i++) {
        // Create composite canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) throw new Error('Failed to get canvas context');

        // Draw both canvases (pattern + particles)
        canvases.forEach((canvas) => {
          ctx.drawImage(canvas, 0, 0);
        });

        // Add watermark
        const frameCanvas = addWatermarkToCanvas(tempCanvas);

        // Add frame to GIF
        gif.addFrame(frameCanvas, { delay: frameInterval, copy: true });

        // Update progress
        setExportProgress(Math.round((i / totalFrames) * 80));

        // Wait for next frame
        await new Promise((resolve) => setTimeout(resolve, frameInterval));
      }

      setExportProgress(85);

      // Render GIF
      gif.on('finished', (blob: Blob) => {
        const filename = `subtle-frequencies-${frequency}Hz-${Date.now()}.gif`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        setExportProgress(100);
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      });

      gif.render();
    } catch (error) {
      console.error('Failed to export GIF:', error);
      alert('Failed to export GIF. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  /**
   * Export as Video
   */
  const exportVideo = async () => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      if (!isPlaying) {
        alert('Please start playing audio before exporting video');
        setIsExporting(false);
        return;
      }

      // Find the visualizer canvas container
      const canvases = document.querySelectorAll<HTMLCanvasElement>('canvas');
      if (canvases.length === 0) {
        throw new Error('No visualization to export');
      }

      // Create a composite canvas with watermark
      const firstCanvas = canvases[0];
      const compositeCanvas = document.createElement('canvas');
      compositeCanvas.width = firstCanvas.width;
      compositeCanvas.height = firstCanvas.height;
      const ctx = compositeCanvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // Start capturing
      const stream = compositeCanvas.captureStream(30); // 30 fps
      recordedChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const filename = `subtle-frequencies-${frequency}Hz-${Date.now()}.webm`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        setExportProgress(100);
        setIsExporting(false);
        setExportProgress(0);
        onClose();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      // Draw frames continuously
      const startTime = Date.now();
      const animate = () => {
        const elapsed = (Date.now() - startTime) / 1000;

        if (elapsed >= duration) {
          mediaRecorder.stop();
          return;
        }

        // Clear and redraw
        ctx.clearRect(0, 0, compositeCanvas.width, compositeCanvas.height);
        canvases.forEach((canvas) => {
          ctx.drawImage(canvas, 0, 0);
        });

        // Add watermark
        if (watermark) {
          const fontSize = Math.max(16, compositeCanvas.width / 30);
          ctx.font = `${fontSize}px Inter, sans-serif`;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          const text = 'SubtleFrequencies.com';
          const padding = fontSize * 0.8;
          ctx.fillText(text, compositeCanvas.width / 2, compositeCanvas.height - padding);
        }

        // Update progress
        setExportProgress(Math.round((elapsed / duration) * 100));

        requestAnimationFrame(animate);
      };

      animate();
    } catch (error) {
      console.error('Failed to export video:', error);
      alert('Failed to export video. Please try again.');
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  /**
   * Handle export based on selected format
   */
  const handleExport = () => {
    switch (format) {
      case 'png':
        exportPNG();
        break;
      case 'gif':
        exportGIF();
        break;
      case 'video':
        exportVideo();
        break;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card p-6 max-w-md w-full mx-4 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-display">Export Visualization</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isExporting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Format Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setFormat('png')}
              disabled={isExporting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                format === 'png'
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20'
              }`}
            >
              PNG
            </button>
            <button
              onClick={() => setFormat('gif')}
              disabled={isExporting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                format === 'gif'
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20'
              }`}
            >
              GIF
            </button>
            <button
              onClick={() => setFormat('video')}
              disabled={isExporting}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                format === 'video'
                  ? 'bg-gradient-to-r from-accent-gold to-accent-amber text-dark-base'
                  : 'bg-white/10 hover:bg-white/20 border border-white/20'
              }`}
            >
              Video
            </button>
          </div>
        </div>

        {/* Duration (for GIF/Video) */}
        {(format === 'gif' || format === 'video') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Duration: {duration}s
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              disabled={isExporting}
              className="slider"
            />
            <div className="text-xs text-gray-500">Recommended: 3-5 seconds</div>
          </div>
        )}

        {/* Watermark Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">Add Watermark</label>
          <button
            onClick={() => setWatermark(!watermark)}
            disabled={isExporting}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              watermark ? 'bg-accent-gold' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                watermark ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Progress Bar */}
        {isExporting && (
          <div className="space-y-2">
            <div className="text-sm text-center text-gray-400">Exporting...</div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-accent-gold to-accent-amber h-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? 'Exporting...' : `Export ${format.toUpperCase()}`}
        </button>

        <div className="text-xs text-gray-500 text-center">
          {format === 'png' && 'High-quality still image of current pattern'}
          {format === 'gif' && 'Animated loop (requires audio playing)'}
          {format === 'video' && 'WebM video with audio visualization (requires audio playing)'}
        </div>
      </div>
    </div>
  );
}
