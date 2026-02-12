# Subtle Frequencies

A premium Progressive Web App for healing frequency generation with binaural beats and ambient textures.

## Features

### Core Functionality
- **Frequency Generator**: Pure sine wave tones from 20Hz to 20,000Hz
- **10 Healing Frequency Presets**: 174Hz, 285Hz, 396Hz, 417Hz, 432Hz, 528Hz, 639Hz, 741Hz, 852Hz, 963Hz
- **Binaural Beats**: Delta, Theta, Alpha, Beta, Gamma brainwave states with custom Hz control
- **Ambient Textures**: Warm Pad, Ocean, Rain, and Singing Bowl background layers
- **Session Timer**: 5, 10, 15, 20, 30, 60 minute sessions with gentle fade-out
- **Preset Management**: Save and load custom configurations to localStorage
- **Circular Visualizer**: Ambient, meditative visualization that reacts to frequency

### Technical Features
- **100% Real-time Audio**: All sounds generated via Web Audio API (no audio files)
- **PWA**: Fully installable on iOS and Android with offline support
- **Smooth Audio**: Proper ramping on all volume changes to prevent clicks/pops
- **Responsive Design**: Mobile-first with premium dark glassmorphism UI
- **Zero Dependencies**: Pure Web Audio API, no external audio libraries

## Getting Started

### Development
```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Testing PWA
After building, test the PWA functionality:
1. Run `npm run preview` to serve the production build
2. Open in Chrome/Edge
3. Click the install icon in the address bar
4. Test offline by going offline in DevTools Network tab

## Project Structure

```
subtle-frequencies/
├── src/
│   ├── audio/              # Audio engine modules
│   │   ├── AudioEngine.ts        # Core Web Audio API context management
│   │   ├── frequencyEngine.ts    # Pure tone generation
│   │   ├── binauralEngine.ts     # Binaural beats stereo engine
│   │   └── textureEngine.ts      # Ambient texture generation
│   ├── components/         # React UI components
│   │   ├── Visualizer.tsx        # Canvas-based circular visualizer
│   │   ├── FrequencyPlayer.tsx   # Main frequency controls
│   │   ├── BinauralBeats.tsx     # Binaural beat controls
│   │   ├── AmbientTexture.tsx    # Texture selector
│   │   ├── SessionTimer.tsx      # Countdown timer
│   │   └── PresetManager.tsx     # Save/load presets
│   ├── hooks/
│   │   └── useAudioContext.ts    # React hook for audio initialization
│   ├── utils/
│   │   └── presets.ts            # Preset management & localStorage
│   ├── App.tsx             # Main application component
│   └── index.css           # Tailwind + custom styles
├── public/
│   ├── manifest.json       # PWA manifest
│   ├── sw.js              # Service worker
│   └── icon.svg           # App icon
└── index.html             # HTML entry point with PWA meta tags
```

## Audio Architecture

### AudioEngine (Singleton)
- Manages shared AudioContext
- Master gain node for global volume control
- iOS audio unlock handling

### FrequencyEngine
- Generates pure sine wave oscillators
- Smooth frequency transitions with linearRampToValueAtTime
- Fade in/out on play/stop

### BinauralEngine
- Creates stereo binaural beats (two oscillators panned L/R)
- Base frequency + beat offset for brainwave entrainment
- Independent volume control

### TextureEngine
- Generates noise buffers (white, pink, brown, harmonic)
- Real-time filtering with BiquadFilterNode
- LFO modulation for warm pad and ocean textures

## Design System

### Colors
- Dark Base: `#0a0a0f`
- Dark Card: `#1a1a24`
- Accent Gold: `#d4af37`
- Accent Amber: `#ffbf69`

### Typography
- UI: DM Sans (sans-serif)
- Display: Cormorant Garamond (serif)

### Effects
- Glassmorphism: `backdrop-blur-md` with `bg-white/5`
- Smooth transitions: 300ms ease-in-out
- Gradient accents: Gold to Amber

## Browser Support

- Chrome/Edge: Full support
- Safari (iOS): Full support (requires user gesture for audio)
- Firefox: Full support
- Mobile browsers: Optimized for touch

## Performance

- Build size: ~221KB JS, ~13KB CSS (gzipped: ~68KB + ~3KB)
- Load time: < 2 seconds
- Audio latency: Minimal (Web Audio API scheduling)
- Offline: Fully functional after first load

## Monetization Prep

- Ad placeholder included (320x50 banner at bottom)
- Code structured for premium feature gates
- localStorage ready for user preferences
- PWA = app store distribution ready

## License

Private project - all rights reserved.

## Next Steps

1. Test on multiple devices (iOS, Android)
2. Add Google Analytics
3. Implement ad network integration
4. Add premium features behind paywall
5. Submit to app stores as PWA
6. Collect user feedback
7. Iterate on presets and frequencies

## Credits

Built with:
- React + TypeScript
- Vite
- Tailwind CSS v3
- Web Audio API
