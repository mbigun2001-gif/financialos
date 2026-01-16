# PWA Setup Instructions

## Installation

1. Install the required dependencies:
```bash
npm install next-pwa sharp --save-dev
```

## Build and Deploy

1. Build the production version:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Adding to Home Screen (iPhone)

1. Open the app in Safari on your iPhone
2. Tap the Share button (square with arrow)
3. Scroll down and tap "Add to Home Screen"
4. Customize the name if needed
5. Tap "Add"

The app will now appear on your home screen and open in standalone mode (without browser UI).

## Features

- ✅ Standalone mode (no browser UI)
- ✅ Offline support via service workers
- ✅ App icons for all devices
- ✅ iOS-specific optimizations
- ✅ Fast loading with caching

## Notes

- Service workers are only enabled in production builds
- The app will cache resources for offline use
- Icons are automatically generated from SVG
