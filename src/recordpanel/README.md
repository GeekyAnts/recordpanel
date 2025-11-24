# RecordPanel SDK

A React SDK for screen recording with camera and audio support.

## Installation

The SDK is included in your project. Import it in your React app:

```jsx
import { RecordPanelHost, useRecordPanel } from './recordpanel'
```

## Setup

Wrap your app with the `RecordPanelHost` component at the root level:

```jsx
import { RecordPanelHost, useRecordPanel } from './recordpanel'

function MyComponent() {
  const recorder = useRecordPanel()
  
  // Use recorder API here
  return <div>...</div>
}

function App() {
  return (
    <RecordPanelHost>
      <MyComponent />
    </RecordPanelHost>
  )
}
```

## API

The SDK provides a `useRecordPanel` hook that returns the recorder API:

### `useRecordPanel()`

Returns the recorder API object. Must be used within a component that's wrapped by `RecordPanelHost`.

```javascript
const recorder = useRecordPanel()
```

### `recorder.start(options?)`

Starts recording. Requests permissions if not already granted.

```javascript
await recorder.start({
  cameraEnabled: true,  // default: true
  audioEnabled: true     // default: true
})
```

### `recorder.stop()`

Stops recording and returns the recording result.

```javascript
const result = await recorder.stop()
// Returns: { blob, url, mimeType, size }
```

The result object contains:
- `blob`: Blob object of the recording
- `url`: Object URL for the recording (use `URL.revokeObjectURL()` after use)
- `mimeType`: MIME type of the recording (e.g., 'video/webm')
- `size`: Size in bytes

### `recorder.pause()`

Pauses the current recording.

```javascript
recorder.pause()
```

### `recorder.resume()`

Resumes a paused recording.

```javascript
recorder.resume()
```

### `recorder.restart()`

Stops the current recording and starts a new one.

```javascript
await recorder.restart()
```

### `recorder.show()`

Shows the recorder UI overlay.

```javascript
recorder.show()
```

### `recorder.hide()`

Hides the recorder UI overlay.

```javascript
recorder.hide()
```

### State Checkers

```javascript
// Check if currently recording
recorder.isRecording() // returns boolean

// Check if paused
recorder.isPaused() // returns boolean

// Check if UI is visible
recorder.isVisible() // returns boolean

// Get current state
recorder.getState() // returns 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'
```

## Example Usage

```jsx
import { useState } from 'react'
import { RecordPanelHost, useRecordPanel } from './recordpanel'

function MyComponent() {
  const [recordingResult, setRecordingResult] = useState(null)
  const recorder = useRecordPanel()

  const handleStart = async () => {
    try {
      await recorder.start({
        cameraEnabled: true,
        audioEnabled: true
      })
    } catch (error) {
      console.error('Failed to start:', error)
    }
  }

  const handleStop = async () => {
    try {
      const result = await recorder.stop()
      console.log('Recording complete:', result)
      
      // Download the recording
      const a = document.createElement('a')
      a.href = result.url
      a.download = `recording-${Date.now()}.webm`
      a.click()
      
      // Clean up
      URL.revokeObjectURL(result.url)
      setRecordingResult(result)
    } catch (error) {
      console.error('Failed to stop:', error)
    }
  }

  return (
    <>
      <button onClick={handleStart}>Start Recording</button>
      <button onClick={handleStop}>Stop Recording</button>
      {recordingResult && (
        <div>
          <p>Recording size: {(recordingResult.size / 1024 / 1024).toFixed(2)} MB</p>
          <video src={recordingResult.url} controls />
        </div>
      )}
    </>
  )
}

function App() {
  return (
    <RecordPanelHost>
      <MyComponent />
    </RecordPanelHost>
  )
}
```

## UI Features

The SDK provides a floating UI overlay that includes:

- **Camera Preview**: Shows your camera feed when enabled
- **Camera Toggle**: Enable/disable camera
- **Audio Toggle**: Enable/disable audio (microphone + system audio)
- **Pause/Resume**: Pause or resume recording
- **Restart**: Stop current recording and start a new one
- **Stop**: Stop recording and get the result
- **Close**: Hide the UI overlay

The UI appears in the bottom-right corner of the screen when visible.

## Notes

- The SDK automatically requests screen sharing permissions when `start()` is called
- Camera and microphone permissions are requested together
- System audio capture depends on browser support (Chrome/Edge support it)
- Recordings are saved as WebM files by default (MP4 if supported)
- Always call `URL.revokeObjectURL()` on the result URL after use to prevent memory leaks
- The `useRecordPanel` hook must be used within a component that's wrapped by `RecordPanelHost`
