import { useState, useEffect } from 'react'
import { ThemeProvider } from 'next-themes'
import { RecordPanelHost, useRecordPanel, type RecordingResult } from './recordpanel'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Logo } from '@/components/Logo'
import { CodeBlock } from '@/components/CodeBlock'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  Code, 
  Copy, 
  Check,
  Video,
  Mic,
  Camera,
  Zap,
  Palette,
  Download,
  Github,
  ExternalLink,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import './App.css'

function AppContent() {
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple')
  const recorder = useRecordPanel()

  const handleCapture = async () => {
    try {
      setIsCapturing(true)
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
      
      toast.success('Recording completed!', {
        description: `Recording downloaded (${(result.size / 1024 / 1024).toFixed(2)} MB)`,
      })
      
      setTimeout(() => {
        URL.revokeObjectURL(result.url)
      }, 100)
    } catch (error) {
      console.error('Failed to capture recording:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('cancel') || message.includes('denied')) {
        toast.info('Recording cancelled', {
          description: 'You cancelled the recording operation.',
        })
      } else {
        toast.error('Failed to capture recording', {
          description: message,
        })
      }
    } finally {
      setIsCapturing(false)
    }
  }

  const handleStartRecording = async () => {
    try {
      await recorder.start({
        cameraEnabled: true,
        audioEnabled: true
      })
      toast.success('Recording started')
    } catch (error) {
      console.error('Failed to start recording:', error)
      const message = error instanceof Error ? error.message : 'Unknown error'
      if (message.includes('cancel') || message.includes('denied')) {
        toast.info('Recording cancelled', {
          description: 'Permission was denied or cancelled.',
        })
      } else {
        toast.error('Failed to start recording', {
          description: message,
        })
      }
    }
  }

  const handleStopRecording = async () => {
    try {
      const result = await recorder.stop()
      if (result) {
        setRecordingResult(result)
        const a = document.createElement('a')
        a.href = result.url
        const extension = result.mimeType.includes('mp4') ? 'mp4' : 'webm'
        a.download = `recording-${Date.now()}.${extension}`
        a.click()
        toast.success('Recording stopped', {
          description: `Recording downloaded (${(result.size / 1024 / 1024).toFixed(2)} MB)`,
        })
        setTimeout(() => {
          URL.revokeObjectURL(result.url)
        }, 100)
      }
    } catch (error) {
      console.error('Failed to stop recording:', error)
      toast.error('Failed to stop recording')
    }
  }

  const handlePause = () => {
    recorder.pause()
    toast.info('Recording paused')
  }

  const handleResume = () => {
    recorder.resume()
    toast.info('Recording resumed')
  }

  const handleRestart = async () => {
    try {
      await recorder.restart()
      toast.success('Recording restarted')
    } catch (error) {
      console.error('Failed to restart recording:', error)
      toast.error('Failed to restart recording')
    }
  }


  const codeExamples = {
    simple: `import { RecordPanelHost, useRecordPanel } from 'recordpanel'
import 'recordpanel/styles'

function MyComponent() {
  const recorder = useRecordPanel()

  const handleRecord = async () => {
    // One-line API - starts, shows UI, waits for stop, returns result
    const result = await recorder.capture({
      cameraEnabled: true,
      audioEnabled: true
    })
    
    console.log('Recording:', result)
    // { blob, url, mimeType, size }
  }

  return <button onClick={handleRecord}>Record</button>
}

function App() {
  return (
    <RecordPanelHost>
      <MyComponent />
    </RecordPanelHost>
  )
}`,
    advanced: `import { RecordPanelHost, useRecordPanel } from 'recordpanel'
import 'recordpanel/styles'

function AdvancedComponent() {
  const recorder = useRecordPanel()

  const handleStart = async () => {
    await recorder.start({
      cameraEnabled: true,
      audioEnabled: true
    })
  }

  const handlePause = () => recorder.pause()
  const handleResume = () => recorder.resume()
  
  const handleStop = async () => {
    const result = await recorder.stop()
    if (result) {
      console.log('Recording:', result)
    }
  }

  const handleRestart = async () => {
    await recorder.restart()
  }

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={handlePause}>Pause</button>
      <button onClick={handleResume}>Resume</button>
      <button onClick={handleStop}>Stop</button>
      <button onClick={handleRestart}>Restart</button>
    </div>
  )
}

function App() {
  return (
    <RecordPanelHost config={{ theme: 'auto', stopButtonText: 'Send' }}>
      <AdvancedComponent />
    </RecordPanelHost>
  )
}`,
    installation: `npm install recordpanel

# or

yarn add recordpanel

# or

pnpm add recordpanel`
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="ghost" size="sm" asChild>
              <a href="https://github.com/GeekyAnts/recordpanel" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b">
        {/* Subtle gradient backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        <div className="container mx-auto px-4 py-20 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-foreground">
              RecordPanel
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-4">
              A powerful React SDK for screen recording with camera and audio support
            </p>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Beautiful, draggable UI with real-time audio feedback. Perfect for video tutorials, bug reports, and more.
            </p>
            <div className="flex gap-4 justify-center flex-wrap mb-12">
              <Button size="lg" className="gap-2" onClick={handleCapture} disabled={isCapturing}>
                <Play className="h-5 w-5" />
                {isCapturing ? 'Recording...' : 'Try Live Demo'}
              </Button>
              <Button size="lg" variant="outline" className="gap-2" asChild>
                <a href="https://github.com/GeekyAnts/recordpanel" target="_blank" rel="noopener noreferrer">
                  <Github className="h-5 w-5" />
                  View on GitHub
                </a>
              </Button>
            </div>
            
            {/* Demo Video */}
            <div className="max-w-4xl mx-auto mt-12">
              <div className="relative rounded-lg overflow-hidden border shadow-2xl bg-background">
                <video
                  className="w-full h-auto"
                  controls
                  preload="metadata"
                >
                  <source src="/recordpanel-demo.webm" type="video/webm" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Watch RecordPanel in action - screen recording with camera and audio support
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 border-b relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              { icon: Video, title: 'Screen Recording', desc: 'Capture entire screen or specific windows' },
              { icon: Camera, title: 'Camera Support', desc: 'Include webcam with circular preview (Loom-style)' },
              { icon: Mic, title: 'Audio Capture', desc: 'Record microphone and system audio simultaneously' },
              { icon: Zap, title: 'Simple API', desc: 'One-line capture() method for quick integration' },
              { icon: Palette, title: 'Customizable', desc: 'Themes, colors, and button text configuration' },
              { icon: Download, title: 'Easy Export', desc: 'Get recordings as Blob with automatic download' },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-lg border bg-card/50 hover:bg-card hover:shadow-lg transition-all backdrop-blur-sm">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-20 bg-muted/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Live Demo</h2>
            <p className="text-center text-muted-foreground mb-8">
              Try RecordPanel right in your browser. Click the button below to start recording.
            </p>
            
            <div className="bg-card/50 backdrop-blur-sm border rounded-lg p-8 shadow-lg">
              <div className="flex gap-2 mb-6 border-b">
                <button
                  onClick={() => setActiveTab('simple')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'simple'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Simple API
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-2 font-medium transition-colors ${
                    activeTab === 'advanced'
                      ? 'border-b-2 border-primary text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Advanced API
                </button>
              </div>

              {activeTab === 'simple' ? (
                <div className="space-y-6">
                  <div className="text-center">
                    <Button
                      onClick={handleCapture}
                      size="lg"
                      className="gap-2"
                      disabled={isCapturing}
                    >
                      <Play className="h-5 w-5" />
                      {isCapturing ? 'Recording...' : 'Capture Recording'}
                    </Button>
                    <p className="text-sm text-muted-foreground mt-4">
                      Click to start recording. Use the floating UI controls to stop. Recording will automatically download.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex gap-3 justify-center flex-wrap">
                    <Button onClick={handleStartRecording} variant="outline" className="gap-2">
                      <Play className="h-4 w-4" />
                      Start
                    </Button>
                    <Button onClick={handlePause} variant="outline" className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950">
                      <Pause className="h-4 w-4" />
                      Pause
                    </Button>
                    <Button onClick={handleResume} variant="outline" className="gap-2 border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950">
                      <Play className="h-4 w-4" />
                      Resume
                    </Button>
                    <Button onClick={handleRestart} variant="outline" className="gap-2 border-orange-500 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950">
                      <RotateCcw className="h-4 w-4" />
                      Restart
                    </Button>
                    <Button onClick={handleStopRecording} variant="outline" className="gap-2 border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                      <Square className="h-4 w-4" />
                      Stop
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Use these controls for granular control over the recording process.
                  </p>
                </div>
              )}

              {recordingResult && (
                <div className="mt-8 p-6 bg-muted rounded-lg border">
                  <h3 className="font-semibold mb-4">Last Recording</h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Size:</span>{' '}
                      <span className="font-medium">{(recordingResult.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>{' '}
                      <span className="font-medium">{recordingResult.mimeType}</span>
                    </div>
                  </div>
                  {recordingResult.url && (
                    <video
                      src={recordingResult.url}
                      controls
                      className="w-full rounded-lg border"
                      style={{ maxHeight: '400px' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Installation & Code Examples */}
      <section className="py-20 border-b relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Get Started</h2>
            
            {/* Installation */}
            <div className="mb-12">
              <h3 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Code className="h-6 w-6" />
                Installation
              </h3>
              <CodeBlock code={codeExamples.installation} language="bash" />
            </div>

            {/* Code Examples */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Simple API</h3>
                <CodeBlock code={codeExamples.simple} language="typescript" />
              </div>

              <div>
                <h3 className="text-2xl font-semibold mb-4">Advanced API</h3>
                <CodeBlock code={codeExamples.advanced} language="typescript" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-20 bg-muted/30 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">API Reference</h2>
            
            <div className="space-y-8">
              {[
                {
                  title: 'capture(options?)',
                  desc: 'Simplest way to record. Starts recording, shows UI, waits for stop, returns result.',
                  code: `const result = await recorder.capture({
  cameraEnabled: true,  // default: true
  audioEnabled: true    // default: true
})
// Returns: { blob, url, mimeType, size }`
                },
                {
                  title: 'start(options?)',
                  desc: 'Starts recording. Requests permissions if needed.',
                  code: `await recorder.start({
  cameraEnabled: true,
  audioEnabled: true
})`
                },
                {
                  title: 'stop()',
                  desc: 'Stops recording and returns the result.',
                  code: `const result = await recorder.stop()
// Returns: RecordingResult | null`
                },
                {
                  title: 'pause() / resume()',
                  desc: 'Pause or resume the current recording.',
                  code: `recorder.pause()
recorder.resume()`
                },
                {
                  title: 'restart()',
                  desc: 'Stops current recording and starts a new one. Preserves permissions.',
                  code: `await recorder.restart()`
                },
                {
                  title: 'State Methods',
                  desc: 'Check recording state and duration.',
                  code: `recorder.isRecording()  // boolean
recorder.isPaused()    // boolean
recorder.isVisible()   // boolean
recorder.getState()    // 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'
recorder.getRecordingDuration()  // number (seconds)`
                }
              ].map((api, i) => (
                <div key={i} className="bg-card/50 backdrop-blur-sm border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-2 font-mono">{api.title}</h3>
                  <p className="text-muted-foreground mb-4">{api.desc}</p>
                  <CodeBlock code={api.code} language="typescript" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Browser Support */}
      <section className="py-20 border-b relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Browser Support</h2>
            <p className="text-muted-foreground mb-8">
              RecordPanel works in all modern browsers that support MediaRecorder API
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { name: 'Chrome/Edge', support: 'Full support' },
                { name: 'Firefox', support: 'Screen + Mic' },
                { name: 'Safari', support: 'Screen + Mic' },
              ].map((browser, i) => (
                <div key={i} className="p-6 border rounded-lg bg-card/50 backdrop-blur-sm">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-500 mb-2 mx-auto" />
                  <h3 className="font-semibold mb-1">{browser.name}</h3>
                  <p className="text-sm text-muted-foreground">{browser.support}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              System audio capture requires Chrome/Edge on desktop.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <Logo className="justify-center mb-4" />
            <p className="text-muted-foreground mb-6">
              A powerful React SDK for screen recording with camera and audio support
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/GeekyAnts/recordpanel" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="https://github.com/GeekyAnts/recordpanel/blob/main/README.md" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Documentation
                </a>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-8">
              Made with ❤️ by <a href="https://geekyants.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">GeekyAnts</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <>
      <Toaster />
      <RecordPanelHost 
        config={{
          theme: 'auto',
          stopButtonText: 'Send'
        }}
      >
        <AppContent />
      </RecordPanelHost>
    </>
  )
}

export default App
