import { useState, useRef, useEffect, useMemo, type ReactNode } from 'react'
import { ScreenRecorder } from './recorder'
import { RecorderUI } from './RecorderUI'
import { RecorderContext, type RecorderAPI, type RecorderConfig, type Theme } from './RecorderContext'
import type { StartOptions, RecordingResult } from './recorder'

interface RecordPanelHostProps {
  children: ReactNode
  config?: RecorderConfig
}

export function RecordPanelHost({ children, config: initialConfig = {} }: RecordPanelHostProps) {
  const [visible, setVisible] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [cameraEnabled, setCameraEnabled] = useState(true)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfigState] = useState<RecorderConfig>({
    theme: initialConfig.theme || 'auto',
    stopButtonText: initialConfig.stopButtonText || 'Send'
  })
  const [recordingDuration, setRecordingDuration] = useState(0) // Duration in seconds
  
  const recorderRef = useRef<ScreenRecorder | null>(null)
  const capturePromiseResolverRef = useRef<((result: RecordingResult) => void) | null>(null)
  const capturePromiseRejecterRef = useRef<((error: Error) => void) | null>(null)
  const isCaptureSessionRef = useRef(false)
  const captureOptionsRef = useRef<StartOptions>({})
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const recordingStartTimeRef = useRef<number | null>(null)
  const pausedTimeRef = useRef<number>(0) // Total paused time in milliseconds
  const pauseStartTimeRef = useRef<number | null>(null)

  useEffect(() => {
    // Initialize recorder
    recorderRef.current = new ScreenRecorder()
    
    recorderRef.current.onStateChange = (state) => {
      const wasRecording = isRecording
      const wasPaused = isPaused
      setIsRecording(state === 'recording')
      setIsPaused(state === 'paused')
      
      // Start duration timer when recording starts
      if (state === 'recording' && !wasRecording) {
        // If starting fresh (not resuming), reset everything
        if (!recordingStartTimeRef.current) {
          recordingStartTimeRef.current = Date.now()
          pausedTimeRef.current = 0
          setRecordingDuration(0)
        } else {
          // Resuming from pause - add pause duration to pausedTimeRef
          if (pauseStartTimeRef.current) {
            pausedTimeRef.current += Date.now() - pauseStartTimeRef.current
            pauseStartTimeRef.current = null
          }
        }
        
        durationIntervalRef.current = setInterval(() => {
          if (recordingStartTimeRef.current) {
            const totalElapsed = Date.now() - recordingStartTimeRef.current
            const actualElapsed = totalElapsed - pausedTimeRef.current
            setRecordingDuration(Math.floor(actualElapsed / 1000))
          }
        }, 1000)
      }
      
      // Pause duration timer when paused
      if (state === 'paused' && wasRecording && !wasPaused) {
        pauseStartTimeRef.current = Date.now()
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current)
          durationIntervalRef.current = null
        }
      }
      
      // Stop duration timer when recording stops
      if ((state === 'stopped' || state === 'idle') && wasRecording) {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current)
          durationIntervalRef.current = null
        }
        recordingStartTimeRef.current = null
        pauseStartTimeRef.current = null
        pausedTimeRef.current = 0
        setRecordingDuration(0)
      }
    }

    recorderRef.current.onError = (err: Error) => {
      setError(err.message)
      console.error('Recorder error:', err)
    }

    return () => {
      if (recorderRef.current) {
        recorderRef.current.cleanup()
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
      }
    }
  }, [])
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement
    const theme = config.theme === 'auto' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : config.theme
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [config.theme])
  
  // Listen for system theme changes if auto mode
  useEffect(() => {
    if (config.theme !== 'auto') return
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const root = document.documentElement
      if (mediaQuery.matches) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [config.theme])

  const show = () => {
    setVisible(true)
    setError(null)
  }

  const hide = () => {
    // If we're in a capture session and user closes, reject the promise
    if (isCaptureSessionRef.current) {
      if (capturePromiseRejecterRef.current) {
        capturePromiseRejecterRef.current(new Error('Recording cancelled by user'))
        capturePromiseResolverRef.current = null
        capturePromiseRejecterRef.current = null
      }
      isCaptureSessionRef.current = false
      captureOptionsRef.current = {}
    }
    
    setVisible(false)
    setError(null)
  }

  const start = async (options: StartOptions = {}) => {
    try {
      setError(null)
      const recorder = recorderRef.current
      if (!recorder) {
        throw new Error('Recorder not initialized')
      }

      // Request permissions if not already granted
      if (!recorder.getStreams().display) {
        await recorder.requestPermissions({
          cameraEnabled: options.cameraEnabled !== false,
          audioEnabled: options.audioEnabled !== false
        })
      }

      // Start recording
      await recorder.start({
        audioEnabled: audioEnabled && (options.audioEnabled !== false)
      })

      setVisible(true)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error.message)
      throw error
    }
  }

  const pause = () => {
    if (recorderRef.current) {
      recorderRef.current.pause()
    }
  }

  const resume = () => {
    if (recorderRef.current) {
      recorderRef.current.resume()
    }
  }

  const stop = async (): Promise<RecordingResult | null> => {
    try {
      if (!recorderRef.current) {
        return null
      }

      const result = await recorderRef.current.stop()
      
      // If there's a capture promise waiting, resolve it
      if (capturePromiseResolverRef.current && result) {
        capturePromiseResolverRef.current(result)
        capturePromiseResolverRef.current = null
        capturePromiseRejecterRef.current = null
        isCaptureSessionRef.current = false
        captureOptionsRef.current = {}
      }
      
      // Cleanup
      recorderRef.current.cleanup()
      setVisible(false)
      setIsRecording(false)
      setIsPaused(false)
      
      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current)
        durationIntervalRef.current = null
      }
      recordingStartTimeRef.current = null
      pauseStartTimeRef.current = null
      pausedTimeRef.current = 0
      setRecordingDuration(0)

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      
      // If there's a capture promise waiting, reject it
      if (capturePromiseRejecterRef.current) {
        capturePromiseRejecterRef.current(error)
        capturePromiseResolverRef.current = null
        capturePromiseRejecterRef.current = null
        isCaptureSessionRef.current = false
        captureOptionsRef.current = {}
      }
      
      setError(error.message)
      throw error
    }
  }

  const capture = async (options: StartOptions = {}): Promise<RecordingResult> => {
    return new Promise<RecordingResult>(async (resolve, reject) => {
      try {
        // Mark that we're in a capture session
        isCaptureSessionRef.current = true
        captureOptionsRef.current = options
        
        // Store promise resolvers
        capturePromiseResolverRef.current = resolve
        capturePromiseRejecterRef.current = reject

        // Show UI and start recording
        await start(options)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        capturePromiseResolverRef.current = null
        capturePromiseRejecterRef.current = null
        isCaptureSessionRef.current = false
        captureOptionsRef.current = {}
        reject(error)
      }
    })
  }

  const restart = async () => {
    try {
      // If we're in a capture session, restart without resolving the promise
      const isCaptureSession = isCaptureSessionRef.current
      
      // Stop current recording (but don't resolve capture promise if in session)
      if (recorderRef.current) {
        // Temporarily clear capture resolvers to prevent resolution
        const tempResolver = capturePromiseResolverRef.current
        const tempRejecter = capturePromiseRejecterRef.current
        
        // Clear them temporarily
        capturePromiseResolverRef.current = null
        capturePromiseRejecterRef.current = null
        
        const recorder = recorderRef.current
        
        // If in capture session and streams exist, use restartRecording to preserve streams
        if (isCaptureSession && recorder.getStreams().display) {
          // Restart recording without cleaning up streams
          await recorder.restartRecording()
        } else {
          // Full cleanup if not in capture session or no streams
          await recorder.stop()
          recorder.cleanup()
        }
        
        setIsRecording(false)
        setIsPaused(false)
        
        // Reset duration tracking
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current)
          durationIntervalRef.current = null
        }
        recordingStartTimeRef.current = null
        pauseStartTimeRef.current = null
        pausedTimeRef.current = 0
        setRecordingDuration(0)
        
        // Restore capture resolvers if in capture session
        if (isCaptureSession) {
          capturePromiseResolverRef.current = tempResolver
          capturePromiseRejecterRef.current = tempRejecter
        }
      }
      
      // Small delay before restarting
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Start new recording (with same options if in capture session)
      // If streams exist, start() won't ask for permissions again
      const optionsToUse = isCaptureSession ? captureOptionsRef.current : {}
      await start(optionsToUse)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      
      // If in capture session, reject the promise
      if (isCaptureSessionRef.current && capturePromiseRejecterRef.current) {
        capturePromiseRejecterRef.current(error)
        capturePromiseResolverRef.current = null
        capturePromiseRejecterRef.current = null
        isCaptureSessionRef.current = false
        captureOptionsRef.current = {}
      }
      
      setError(error.message)
      throw error
    }
  }

  const toggleCamera = () => {
    const newState = !cameraEnabled
    setCameraEnabled(newState)
    if (recorderRef.current) {
      recorderRef.current.toggleCamera(newState)
    }
  }

  const toggleAudio = () => {
    const newState = !audioEnabled
    setAudioEnabled(newState)
    if (recorderRef.current) {
      recorderRef.current.toggleAudio(newState)
    }
  }

  const setConfig = (newConfig: RecorderConfig) => {
    setConfigState(prev => ({ ...prev, ...newConfig }))
  }

  const getRecordingDuration = () => {
    return recordingDuration
  }

  // Create API object
  const api: RecorderAPI = useMemo(() => ({
    show,
    hide,
    start,
    pause,
    resume,
    stop,
    restart,
    capture,
    getState: () => recorderRef.current?.getState() ?? 'idle',
    isVisible: () => visible,
    isRecording: () => isRecording,
    isPaused: () => isPaused,
    getRecordingDuration,
    setConfig
  }), [visible, isRecording, isPaused, capture, recordingDuration])

  return (
    <RecorderContext.Provider value={api}>
      {children}
      {error && visible && (
        <div className="fixed top-4 right-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg z-[10001] max-w-sm shadow-lg backdrop-blur-sm">
          <div className="flex items-start gap-2">
            <span className="text-sm font-medium">Error:</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}
      <RecorderUI
        visible={visible}
        recorder={recorderRef.current}
        onClose={hide}
        cameraEnabled={cameraEnabled}
        audioEnabled={audioEnabled}
        onToggleCamera={toggleCamera}
        onToggleAudio={toggleAudio}
        onStop={stop}
        onPause={pause}
        onResume={resume}
        onRestart={restart}
        isRecording={isRecording}
        isPaused={isPaused}
        recordingDuration={recordingDuration}
        stopButtonText={config.stopButtonText || 'Send'}
      />
    </RecorderContext.Provider>
  )
}
