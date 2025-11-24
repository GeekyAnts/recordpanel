# RecordPanel

<div align="center">

**A powerful React SDK for screen recording with camera and audio support**

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [API Reference](#api-reference) • [Examples](#examples)

</div>

---

## 🎬 Demo

<div align="center">

[![RecordPanel Demo](https://img.shields.io/badge/▶️-Watch%20on%20YouTube-red?style=for-the-badge)](https://www.youtube.com/watch?v=Kz4beXoC32I)

[![RecordPanel Demo Video](https://img.youtube.com/vi/Kz4beXoC32I/maxresdefault.jpg)](https://www.youtube.com/watch?v=Kz4beXoC32I)

*Click the image above to watch RecordPanel in action - screen recording with camera and audio support*

</div>

---

## Overview

RecordPanel is a feature-rich React SDK that enables screen recording with camera and audio capture capabilities. It provides a beautiful, draggable floating UI with real-time audio feedback, making it perfect for creating video tutorials, bug reports, or any application that requires screen recording functionality.

## Features

✨ **Core Features**
- 🎥 **Screen Recording** - Capture your entire screen or specific windows
- 📹 **Camera Support** - Include your webcam feed with circular preview (Loom-style)
- 🎤 **Audio Capture** - Record microphone and system audio simultaneously
- 🎨 **Beautiful UI** - Modern, draggable floating panel with smooth animations
- 📊 **Audio Feedback** - Real-time visual audio level indicators
- ⏸️ **Pause/Resume** - Control recording playback on the fly
- 🔄 **Restart** - Quickly restart recordings without re-requesting permissions
- ⏱️ **Duration Display** - Real-time recording duration in MM:SS format
- 🎯 **Simple API** - One-line `capture()` method for quick integration

🎨 **UI Features**
- Draggable floating panel (drag anywhere except buttons)
- Circular camera preview (120px, Loom-style)
- Compact, modern design
- Real-time audio level visualization
- Recording indicator with pulsing red dot
- Configurable theme (light, dark, auto)
- Customizable stop button text

🔧 **Technical Features**
- TypeScript support with full type definitions
- Tree-shakeable (only imports what you use)
- Zero CSS conflicts (scoped styles)
- Browser permission management
- Automatic codec fallback (VP9 → VP8 → MP4)
- Memory-efficient blob handling
- Pause/resume duration tracking

## Installation

```bash
npm install recordpanel
```

or

```bash
yarn add recordpanel
```

or

```bash
pnpm add recordpanel
```

### Peer Dependencies

RecordPanel requires React 18+ or React 19+:

```bash
npm install react react-dom
```

## Quick Start

### 1. Wrap Your App

Wrap your application with `RecordPanelHost` at the root level:

```jsx
import { RecordPanelHost } from 'recordpanel'
import 'recordpanel/styles'

function App() {
  return (
    <RecordPanelHost>
      <YourApp />
    </RecordPanelHost>
  )
}
```

### 2. Use the Hook

Use the `useRecordPanel` hook in any component:

```jsx
import { useRecordPanel } from 'recordpanel'

function MyComponent() {
  const recorder = useRecordPanel()

  const handleRecord = async () => {
    // Simple one-line API
    const result = await recorder.capture({
      cameraEnabled: true,
      audioEnabled: true
    })
    
    console.log('Recording:', result)
    // result contains: { blob, url, mimeType, size }
  }

  return <button onClick={handleRecord}>Start Recording</button>
}
```

### 3. Complete Example

```jsx
import { useState } from 'react'
import { RecordPanelHost, useRecordPanel } from 'recordpanel'
import 'recordpanel/styles'

function RecordingComponent() {
  const [recording, setRecording] = useState(null)
  const recorder = useRecordPanel()

  const handleCapture = async () => {
    try {
      const result = await recorder.capture({
        cameraEnabled: true,
        audioEnabled: true
      })
      
      setRecording(result)
      
      // Download the recording
      const a = document.createElement('a')
      a.href = result.url
      a.download = `recording-${Date.now()}.webm`
      a.click()
      
      // Clean up
      URL.revokeObjectURL(result.url)
    } catch (error) {
      console.error('Recording failed:', error)
    }
  }

  return (
    <div>
      <button onClick={handleCapture}>Record Screen</button>
      {recording && (
        <video src={recording.url} controls />
      )}
    </div>
  )
}

function App() {
  return (
    <RecordPanelHost>
      <RecordingComponent />
    </RecordPanelHost>
  )
}
```

## API Reference

### `RecordPanelHost`

The root component that provides the recording context to your app.

#### Props

```typescript
interface RecordPanelHostProps {
  children: ReactNode
  config?: RecorderConfig
}
```

#### Configuration

```typescript
interface RecorderConfig {
  theme?: 'light' | 'dark' | 'auto'  // Default: 'auto'
  stopButtonText?: string             // Default: 'Send'
}
```

**Example:**

```jsx
<RecordPanelHost 
  config={{
    theme: 'dark',
    stopButtonText: 'Finish'
  }}
>
  <YourApp />
</RecordPanelHost>
```

### `useRecordPanel()`

Returns the recorder API object. Must be used within a component wrapped by `RecordPanelHost`.

```typescript
const recorder = useRecordPanel()
```

### API Methods

#### `recorder.capture(options?)`

The simplest way to record. Starts recording, shows UI, waits for user to stop, and returns the result.

```typescript
const result = await recorder.capture({
  cameraEnabled?: boolean  // Default: true
  audioEnabled?: boolean    // Default: true
})

// Returns: RecordingResult
```

**Example:**

```jsx
const handleCapture = async () => {
  try {
    const result = await recorder.capture({
      cameraEnabled: true,
      audioEnabled: true
    })
    console.log('Recording complete:', result)
  } catch (error) {
    console.error('Capture failed:', error)
  }
}
```

#### `recorder.start(options?)`

Starts recording. Requests permissions if not already granted.

```typescript
await recorder.start({
  cameraEnabled?: boolean  // Default: true
  audioEnabled?: boolean    // Default: true
})
```

#### `recorder.stop()`

Stops recording and returns the result.

```typescript
const result = await recorder.stop()
// Returns: RecordingResult | null
```

#### `recorder.pause()`

Pauses the current recording.

```typescript
recorder.pause()
```

#### `recorder.resume()`

Resumes a paused recording.

```typescript
recorder.resume()
```

#### `recorder.restart()`

Stops the current recording and starts a new one. Preserves permissions if already granted.

```typescript
await recorder.restart()
```

#### `recorder.show()`

Shows the recorder UI overlay.

```typescript
recorder.show()
```

#### `recorder.hide()`

Hides the recorder UI overlay.

```typescript
recorder.hide()
```

#### `recorder.setConfig(config)`

Updates the recorder configuration dynamically.

```typescript
recorder.setConfig({
  theme: 'dark',
  stopButtonText: 'Finish'
})
```

### State Methods

#### `recorder.getState()`

Returns the current recording state.

```typescript
const state = recorder.getState()
// Returns: 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'
```

#### `recorder.isRecording()`

Checks if currently recording.

```typescript
const isRecording = recorder.isRecording() // boolean
```

#### `recorder.isPaused()`

Checks if recording is paused.

```typescript
const isPaused = recorder.isPaused() // boolean
```

#### `recorder.isVisible()`

Checks if the UI overlay is visible.

```typescript
const isVisible = recorder.isVisible() // boolean
```

#### `recorder.getRecordingDuration()`

Gets the current recording duration in seconds (includes pause time handling).

```typescript
const duration = recorder.getRecordingDuration() // number (seconds)
```

### Types

#### `RecordingResult`

```typescript
interface RecordingResult {
  blob: Blob           // The recording blob
  url: string          // Object URL (revoke after use)
  mimeType: string     // e.g., 'video/webm' or 'video/mp4'
  size: number         // Size in bytes
}
```

#### `RecorderState`

```typescript
type RecorderState = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'
```

#### `RecorderConfig`

```typescript
interface RecorderConfig {
  theme?: 'light' | 'dark' | 'auto'
  stopButtonText?: string
}
```

## Examples

### Simple Capture

```jsx
function SimpleRecording() {
  const recorder = useRecordPanel()

  const handleRecord = async () => {
    const result = await recorder.capture()
    console.log('Recording:', result)
  }

  return <button onClick={handleRecord}>Record</button>
}
```

### Advanced Control

```jsx
function AdvancedRecording() {
  const recorder = useRecordPanel()
  const [isRecording, setIsRecording] = useState(false)

  const handleStart = async () => {
    await recorder.start({
      cameraEnabled: true,
      audioEnabled: true
    })
    setIsRecording(true)
  }

  const handleStop = async () => {
    const result = await recorder.stop()
    if (result) {
      console.log('Recording:', result)
      setIsRecording(false)
    }
  }

  const handlePause = () => {
    recorder.pause()
  }

  const handleResume = () => {
    recorder.resume()
  }

  return (
    <div>
      {!isRecording ? (
        <button onClick={handleStart}>Start Recording</button>
      ) : (
        <>
          <button onClick={handlePause}>Pause</button>
          <button onClick={handleResume}>Resume</button>
          <button onClick={handleStop}>Stop</button>
        </>
      )}
    </div>
  )
}
```

### With State Management

```jsx
function RecordingWithState() {
  const recorder = useRecordPanel()
  const [recording, setRecording] = useState(null)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    if (recorder.isRecording()) {
      const interval = setInterval(() => {
        setDuration(recorder.getRecordingDuration())
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [recorder.isRecording()])

  const handleCapture = async () => {
    const result = await recorder.capture()
    setRecording(result)
  }

  return (
    <div>
      <button onClick={handleCapture}>Record</button>
      {recorder.isRecording() && (
        <div>Recording: {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}</div>
      )}
      {recording && (
        <video src={recording.url} controls />
      )}
    </div>
  )
}
```

### Custom Theme

```jsx
function ThemedApp() {
  return (
    <RecordPanelHost 
      config={{
        theme: 'dark',
        stopButtonText: 'Finish Recording'
      }}
    >
      <YourApp />
    </RecordPanelHost>
  )
}
```

## UI Features

The RecordPanel UI provides a comprehensive set of controls:

### Floating Panel

- **Draggable** - Click and drag anywhere on the panel (except buttons) to reposition
- **Compact Design** - Small footprint, doesn't obstruct your screen
- **Smooth Animations** - Slide-in animation when appearing

### Camera Preview

- **Circular Design** - 120px circular preview (Loom-style)
- **Positioned Above Controls** - Appears above the control bar when enabled
- **Recording Indicator** - Red pulsing dot in the top-right corner
- **Audio Feedback** - Visual audio level bar at the bottom

### Control Bar

- **Duration Display** - Shows recording time in MM:SS format
- **Audio Meter** - Real-time audio level visualization (5 bars)
- **Camera Toggle** - Enable/disable camera feed
- **Audio Toggle** - Enable/disable microphone
- **Pause/Resume** - Control recording playback
- **Restart** - Restart recording (preserves permissions)
- **Stop/Send** - Stop recording and get result (configurable text)
- **Close** - Hide the UI overlay

## Styling & Customization

### CSS Variables

RecordPanel uses CSS variables that you can customize:

```css
:root {
  --recordpanel-primary: 221 83 53;
  --recordpanel-primary-foreground: 0 0 100;
  --recordpanel-border: 214 218 222;
  --recordpanel-muted: 248 249 250;
  /* ... more variables */
}
```

### Theme Configuration

```jsx
<RecordPanelHost 
  config={{
    theme: 'auto', // 'light' | 'dark' | 'auto'
    stopButtonText: 'Send'
  }}
>
  <YourApp />
</RecordPanelHost>
```

The `auto` theme automatically follows the system preference.

### Custom Styles

All RecordPanel styles are scoped with the `.recordpanel-*` prefix to avoid conflicts. You can override styles if needed:

```css
.recordpanel-overlay {
  /* Your custom styles */
}
```

## Browser Support

RecordPanel works in all modern browsers that support:

- **MediaRecorder API** - Chrome 47+, Firefox 25+, Safari 14.1+, Edge 79+
- **getDisplayMedia** - Chrome 72+, Firefox 66+, Safari 13+, Edge 79+
- **getUserMedia** - Chrome 53+, Firefox 36+, Safari 11+, Edge 12+

### System Audio Capture

System audio capture is supported in:
- ✅ Chrome/Edge (Windows, macOS, Linux)
- ❌ Firefox (not supported)
- ❌ Safari (not supported)

### Recommended Browsers

For the best experience, use:
- **Chrome/Edge** (full feature support)
- **Firefox** (screen + microphone only)
- **Safari** (screen + microphone only)

## TypeScript Support

RecordPanel is written in TypeScript and provides full type definitions:

```typescript
import { 
  RecordPanelHost, 
  useRecordPanel,
  type RecordingResult,
  type RecorderConfig,
  type RecorderState
} from 'recordpanel'
```

## Troubleshooting

### Permissions Not Requested

If permissions aren't being requested, ensure:
- You're using HTTPS (or localhost)
- The browser supports the required APIs
- No browser extensions are blocking permissions

### Recording Stops Early

If recordings are shorter than expected:
- Check browser console for errors
- Ensure sufficient disk space
- Check if browser is closing the MediaRecorder

### Audio Not Recording

- Verify microphone permissions are granted
- Check browser audio settings
- System audio requires Chrome/Edge on desktop

### UI Not Appearing

- Ensure `RecordPanelHost` wraps your app
- Check that `recorder.show()` is called
- Verify CSS is imported: `import 'recordpanel/styles'`

### Memory Issues

Always revoke object URLs after use:

```jsx
const result = await recorder.capture()
// Use result.url
URL.revokeObjectURL(result.url) // Important!
```

## Development

### Building the Library

```bash
npm run build:lib
```

This creates a library build in the `dist` folder.

### Running the Demo

```bash
npm run dev
```

### Project Structure

```
src/
  recordpanel/
    ├── index.ts              # Main exports
    ├── RecorderHost.tsx      # Host component
    ├── RecorderContext.tsx   # Context & hook
    ├── RecorderUI.tsx        # UI component
    ├── recorder.ts            # Core recording logic
    └── styles.css            # Scoped styles
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [React](https://react.dev/)
- Icons from [Lucide React](https://lucide.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)

---

<div align="center">

Made with ❤️ by [GeekyAnts](https://geekyants.com)

[GitHub](https://github.com/GeekyAnts/recordpanel) • [Issues](https://github.com/GeekyAnts/recordpanel/issues) • [Pull Requests](https://github.com/GeekyAnts/recordpanel/pulls)

</div>
