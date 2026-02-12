/**
 * React hook for managing audio context initialization
 */

import { useState, useEffect } from 'react';
import { audioEngine } from '../audio/AudioEngine';

export function useAudioContext() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, setState] = useState<AudioContextState | 'uninitialized'>('uninitialized');

  useEffect(() => {
    // Check if already initialized
    if (audioEngine.isReady()) {
      setIsInitialized(true);
      setState('running');
    }
  }, []);

  const initialize = async () => {
    try {
      await audioEngine.initialize();
      setIsInitialized(true);
      setState('running');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  };

  const resume = async () => {
    try {
      await audioEngine.resume();
      setState('running');
    } catch (error) {
      console.error('Failed to resume audio:', error);
    }
  };

  return {
    isInitialized,
    state,
    initialize,
    resume,
  };
}
