import { useRef, useEffect, useState } from 'react'
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  X 
} from 'lucide-react'
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
    <div className={`recordpanel-overlay ${isDragging ? 'dragging' : ''}`} ref={overlayRef}>
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
                <Pause className="recordpanel-icon-small" />
                <span className="recordpanel-paused-text">Paused</span>
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
                    className={`recordpanel-audio-bar-segment ${
                      audioLevel > (i + 1) / 5 ? 'active' : ''
                    }`}
                    style={{
                      opacity: audioLevel > (i + 1) / 5 ? 0.3 + (audioLevel * 0.7) : 0.2
                    }}
                  />
                ))}
              </div>
            </div>
          )}
          
          <button
            className={`recordpanel-button recordpanel-button-icon ${
              cameraEnabled ? 'recordpanel-button-primary' : 'recordpanel-button-outline'
            }`}
            onClick={onToggleCamera}
            title={cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
          >
            {cameraEnabled ? (
              <Video className="recordpanel-icon" />
            ) : (
              <VideoOff className="recordpanel-icon" />
            )}
          </button>
          
          <button
            className={`recordpanel-button recordpanel-button-icon ${
              audioEnabled ? 'recordpanel-button-primary' : 'recordpanel-button-outline'
            }`}
            onClick={onToggleAudio}
            title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}
          >
            {audioEnabled ? (
              <Mic className="recordpanel-icon" />
            ) : (
              <MicOff className="recordpanel-icon" />
            )}
          </button>

          {isRecording && (
            <>
              {isPaused ? (
                <button
                  className="recordpanel-button recordpanel-button-icon recordpanel-button-resume"
                  onClick={onResume}
                  title="Resume Recording"
                >
                  <Play className="recordpanel-icon" />
                </button>
              ) : (
                <button
                  className="recordpanel-button recordpanel-button-icon recordpanel-button-pause"
                  onClick={onPause}
                  title="Pause Recording"
                >
                  <Pause className="recordpanel-icon" />
                </button>
              )}
              
              <button
                className="recordpanel-button recordpanel-button-icon recordpanel-button-restart"
                onClick={onRestart}
                title="Restart Recording"
              >
                <RotateCcw className="recordpanel-icon" />
              </button>
            </>
          )}

          <button
            className="recordpanel-button recordpanel-button-primary recordpanel-button-stop"
            onClick={onStop}
            title={`${stopButtonText} Recording`}
          >
            {stopButtonText}
          </button>

          <button
            className="recordpanel-button recordpanel-button-icon recordpanel-button-ghost"
            onClick={onClose}
            title="Close"
          >
            <X className="recordpanel-icon" />
          </button>
        </div>
      </div>
    </div>
  )
}
