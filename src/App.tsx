import { useState } from 'react'
import { RecordPanelHost, useRecordPanel, type RecordingResult } from './recordpanel'
import { Button } from '@/components/ui/button'
import { Play, Pause, RotateCcw, Square } from 'lucide-react'
import './App.css'

function AppContent() {
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const recorder = useRecordPanel()

  const handleCapture = async () => {
    try {
      setIsCapturing(true)
      
      // Simple one-line API - starts recording, shows UI, waits for user to stop, returns result
      const result = await recorder.capture({
        cameraEnabled: true,
        audioEnabled: true
      })
      
      setRecordingResult(result)
      console.log('Recording completed:', result)
      
      // Automatically download the recording
      const a = document.createElement('a')
      a.href = result.url
      const extension = result.mimeType.includes('mp4') ? 'mp4' : 'webm'
      a.download = `recording-${Date.now()}.${extension}`
      a.click()
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(result.url)
      }, 100)
    } catch (error) {
      console.error('Failed to capture recording:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to capture recording: ${message}`)
    } finally {
      setIsCapturing(false)
    }
  }

  // Legacy API methods (still available but not needed with capture())
  const handleStartRecording = async () => {
    try {
      await recorder.start({
        cameraEnabled: true,
        audioEnabled: true
      })
    } catch (error) {
      console.error('Failed to start recording:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to start recording: ${message}`)
    }
  }

  const handleStopRecording = async () => {
    try {
      const result = await recorder.stop()
      
      if (result) {
        setRecordingResult(result)
        console.log('Recording completed:', result)
        
        const a = document.createElement('a')
        a.href = result.url
        const extension = result.mimeType.includes('mp4') ? 'mp4' : 'webm'
        a.download = `recording-${Date.now()}.${extension}`
        a.click()
        
        setTimeout(() => {
          URL.revokeObjectURL(result.url)
        }, 100)
      }
    } catch (error) {
      console.error('Failed to stop recording:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to stop recording: ${message}`)
    }
  }

  const handlePause = () => {
    recorder.pause()
  }

  const handleResume = () => {
    recorder.resume()
  }

  const handleRestart = async () => {
    try {
      await recorder.restart()
    } catch (error) {
      console.error('Failed to restart recording:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to restart recording: ${message}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 text-center min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
        Screen Recorder SDK Demo
      </h1>
      <p className="text-muted-foreground mb-8">Example usage of the RecordPanel SDK</p>

      <div className="my-8 space-y-4">
        {/* Simple Capture API */}
        <div className="mb-8">
          <Button
            onClick={handleCapture}
            size="lg"
            className="gap-2"
            disabled={isCapturing}
          >
            <Play className="h-5 w-5" />
            {isCapturing ? 'Recording...' : 'Capture Recording'}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Simple API: Click to start recording, use UI controls to stop, automatically returns result
          </p>
        </div>

        {/* Legacy API (for advanced use cases) */}
        <div className="border-t pt-8">
          <h3 className="text-lg font-semibold mb-4">Advanced API (Legacy)</h3>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={handleStartRecording}
              size="lg"
              variant="outline"
              className="gap-2"
            >
              <Play className="h-5 w-5" />
              Start
            </Button>
            
            <Button
              onClick={handlePause}
              size="lg"
              variant="outline"
              className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
            >
              <Pause className="h-5 w-5" />
              Pause
            </Button>
            
            <Button
              onClick={handleResume}
              size="lg"
              variant="outline"
              className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
            >
              <Play className="h-5 w-5" />
              Resume
            </Button>
            
            <Button
              onClick={handleRestart}
              size="lg"
              variant="outline"
              className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              <RotateCcw className="h-5 w-5" />
              Restart
            </Button>
            
            <Button
              onClick={handleStopRecording}
              size="lg"
              variant="outline"
              className="gap-2 border-red-500 text-red-600 hover:bg-red-50"
            >
              <Square className="h-5 w-5" />
              Stop
            </Button>
          </div>
        </div>
      </div>

      {recordingResult && (
        <div className="mt-8 p-6 bg-card border border-border rounded-lg w-full max-w-4xl shadow-lg">
          <p className="mb-4 font-semibold text-card-foreground">Last Recording Info:</p>
          <div className="text-left space-y-2 text-sm text-muted-foreground mb-4">
            <p><strong className="text-foreground">Size:</strong> {(recordingResult.size / 1024 / 1024).toFixed(2)} MB</p>
            <p><strong className="text-foreground">MIME Type:</strong> {recordingResult.mimeType}</p>
            <p><strong className="text-foreground">URL:</strong> <span className="font-mono text-xs">{recordingResult.url.substring(0, 50)}...</span></p>
          </div>
          
          {recordingResult.url && (
            <div className="mt-4">
              <video
                src={recordingResult.url}
                controls
                className="w-full max-w-2xl mx-auto rounded-lg shadow-lg border border-border"
                style={{ maxHeight: '400px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 p-6 bg-card border border-border rounded-lg text-left max-w-3xl shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-card-foreground">SDK API Usage:</h2>
        <pre className="bg-muted text-foreground p-4 rounded-md overflow-x-auto text-sm border border-border font-mono">
{`import { RecordPanelHost, useRecordPanel } from './recordpanel'

function MyComponent() {
  const recorder = useRecordPanel()

  // Simple API - one line to capture recording
  const handleCapture = async () => {
    const result = await recorder.capture({
      cameraEnabled: true,
      audioEnabled: true
    })
    // Returns: { blob, url, mimeType, size }
    // UI automatically shows, user stops via UI, promise resolves with result
    console.log('Recording:', result)
  }

  // Advanced API (for more control)
  await recorder.start({ cameraEnabled: true, audioEnabled: true })
  recorder.pause()
  recorder.resume()
  const result = await recorder.stop()
  await recorder.restart()
}

// Wrap your app with RecordPanelHost
function App() {
  return (
    <RecordPanelHost>
      <MyComponent />
    </RecordPanelHost>
  )
}`}
        </pre>
      </div>
    </div>
  )
}

function App() {
  return (
    <>
      <RecordPanelHost 
        config={{
          theme: 'auto', // 'light', 'dark', or 'auto'
          stopButtonText: 'Send' // Configurable stop button text
        }}
      >
        <AppContent />
      </RecordPanelHost>
    </>
  )
}

export default App
