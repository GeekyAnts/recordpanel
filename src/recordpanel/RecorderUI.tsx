import { useRef, useEffect, useState } from 'react'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Square, 
  X 
} from 'lucide-react'
import { Button } from './components/ui/button'
import { cn } from './lib/utils'
import type { ScreenRecorder } from './recorder'
import './styles.css'

interface RecorderUIProps {
  visible: boolean
  recorder: ScreenRecorder | null
  onClose: () => void
  cameraEnabled: boolean
  audioEnabled: boolean
  onToggleCamera: () => void
  onToggleAudio: () => void
  onStop: () => Promise<void>
  onPause: () => void
  onResume: () => void
  onRestart: () => Promise<void>
  isRecording: boolean
  isPaused: boolean
  recordingDuration: number
  stopButtonText: string
}

export function RecorderUI({ 
  visible, 
  recorder, 
  onClose,
  cameraEnabled,
  audioEnabled,
  onToggleCamera,
  onToggleAudio,
  onStop,
  onPause,
  onResume,
  onRestart,
  isRecording,
  isPaused,
  recordingDuration,
  stopButtonText
}: RecorderUIProps) {
  
  // Format duration as MM:SS
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  // Set up video feed
  useEffect(() => {
    if (videoRef.current && recorder) {
      const streams = recorder.getStreams()
      if (streams.camera && cameraEnabled) {
        videoRef.current.srcObject = streams.camera
      }
    }
  }, [recorder, cameraEnabled])

  // Set up audio level monitoring
  useEffect(() => {
    if (!recorder || !audioEnabled || !isRecording) {
      setAudioLevel(0)
      return
    }

    const streams = recorder.getStreams()
    const audioTracks = [
      ...(streams.camera?.getAudioTracks() || []),
      ...(streams.display?.getAudioTracks() || [])
    ].filter(track => track.enabled && track.readyState === 'live')

    if (audioTracks.length === 0) {
      setAudioLevel(0)
      return
    }

    try {
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      analyserRef.current = analyser

      // Connect microphone audio
      const audioStream = new MediaStream(audioTracks)
      const source = audioContext.createMediaStreamSource(audioStream)
      source.connect(analyser)

      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateAudioLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray)
          // Get average of lower frequencies (voice range) for better feedback
          const voiceRange = dataArray.slice(0, Math.floor(dataArray.length / 3))
          const average = voiceRange.reduce((sum, val) => sum + val, 0) / voiceRange.length
          const normalizedLevel = Math.min(average / 100, 1) // Normalize to 0-1
          setAudioLevel(normalizedLevel)
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel)
        }
      }

      updateAudioLevel()
    } catch (err) {
      console.warn('Failed to set up audio monitoring:', err)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      setAudioLevel(0)
    }
  }, [recorder, audioEnabled, isRecording])

  // Drag functionality
  useEffect(() => {
    if (!overlayRef.current || !visible) return

    const overlay = overlayRef.current
    let startX = 0
    let startY = 0
    let initialX = 0
    let initialY = 0

    const handleMouseDown = (e: MouseEvent) => {
      // Only prevent dragging if clicking directly on a button
      const target = e.target as HTMLElement
      if (target.closest('button')) {
        return
      }

      setIsDragging(true)
      startX = e.clientX
      startY = e.clientY
      
      // Get current position
      const rect = overlay.getBoundingClientRect()
      initialX = rect.left
      initialY = rect.top

      overlay.classList.add('dragging')

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX
        const deltaY = e.clientY - startY
        
        let newX = initialX + deltaX
        let newY = initialY + deltaY
        
        // Constrain to viewport
        const maxX = window.innerWidth - overlay.offsetWidth
        const maxY = window.innerHeight - overlay.offsetHeight
        
        newX = Math.max(0, Math.min(newX, maxX))
        newY = Math.max(0, Math.min(newY, maxY))
        
        overlay.style.left = `${newX}px`
        overlay.style.top = `${newY}px`
        overlay.style.right = 'auto'
        overlay.style.bottom = 'auto'
        overlay.style.transform = 'none'
      }

      const handleMouseUp = () => {
        setIsDragging(false)
        overlay.classList.remove('dragging')
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    overlay.addEventListener('mousedown', handleMouseDown)

    return () => {
      overlay.removeEventListener('mousedown', handleMouseDown)
    }
  }, [visible])

  if (!visible) return null

  const streams = recorder?.getStreams()
  const showCamera = streams?.camera && cameraEnabled

  return (
    <div className={cn("recordpanel-overlay", isDragging && "dragging")} ref={overlayRef}>
      <div className="recordpanel-container">
        {/* Camera Preview - Absolutely positioned to not affect controls layout */}
        {showCamera && (
          <div className="recordpanel-camera-preview">
            <video 
              ref={videoRef} 
              autoPlay 
              muted 
              playsInline 
              className="recordpanel-video"
            />
            {isRecording && !isPaused && (
              <div className="recordpanel-recording-indicator">
                <span className="recordpanel-dot"></span>
              </div>
            )}
            {isPaused && (
              <div className="recordpanel-paused-indicator">
                <Pause className="w-2.5 h-2.5" />
                <span className="text-[10px] font-semibold">Paused</span>
              </div>
            )}
            {/* Audio level indicator */}
            {audioEnabled && audioLevel > 0.1 && (
              <div className="recordpanel-audio-indicator">
                <div 
                  className="recordpanel-audio-bar"
                  style={{ 
                    height: `${audioLevel * 100}%`,
                    opacity: 0.3 + (audioLevel * 0.7)
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="recordpanel-controls">
          {/* Duration Display */}
          {isRecording && (
            <div className="recordpanel-duration">
              {formatDuration(recordingDuration)}
            </div>
          )}
          
          {/* Audio Level Indicator */}
          {audioEnabled && isRecording && (
            <div className="recordpanel-audio-meter">
              <div className="recordpanel-audio-bars">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "recordpanel-audio-bar-segment",
                      audioLevel > (i + 1) / 5 && "active"
                    )}
                    style={{
                      opacity: audioLevel > (i + 1) / 5 ? 0.3 + (audioLevel * 0.7) : 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          <Button
            variant={cameraEnabled ? "default" : "outline"}
            size="icon"
            onClick={onToggleCamera}
            className={cn(
              "h-8 w-8",
              cameraEnabled && "bg-primary hover:bg-primary/90"
            )}
            title={cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
          >
            {cameraEnabled ? (
              <Video className="h-4 w-4" />
            ) : (
              <VideoOff className="h-4 w-4" />
            )}
          </Button>
          
          <Button
            variant={audioEnabled ? "default" : "outline"}
            size="icon"
            onClick={onToggleAudio}
            className={cn(
              "h-8 w-8",
              audioEnabled && "bg-primary hover:bg-primary/90"
            )}
            title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}
          >
            {audioEnabled ? (
              <Mic className="h-4 w-4" />
            ) : (
              <MicOff className="h-4 w-4" />
            )}
          </Button>

          {isRecording && (
            <>
              {isPaused ? (
                <Button
                  variant="default"
                  size="icon"
                  onClick={onResume}
                  className="h-8 w-8 bg-green-600 hover:bg-green-700"
                  title="Resume Recording"
                >
                  <Play className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="icon"
                  onClick={onPause}
                  className="h-8 w-8 bg-yellow-600 hover:bg-yellow-700"
                  title="Pause Recording"
                >
                  <Pause className="h-4 w-4" />
                </Button>
              )}
              
              <Button
                variant="outline"
                size="icon"
                onClick={onRestart}
                className="h-8 w-8 border-orange-500 text-orange-600 hover:bg-orange-50"
                title="Restart Recording"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </>
          )}

          <Button
            variant="default"
            onClick={onStop}
            className="h-8 px-3 text-sm bg-primary hover:bg-primary/90"
            title={`${stopButtonText} Recording`}
          >
            {stopButtonText}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 hover:bg-muted"
            title="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
