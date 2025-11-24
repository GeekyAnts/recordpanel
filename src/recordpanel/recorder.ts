// Core recording logic

export type RecorderState = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped'

export interface RecordingResult {
  blob: Blob
  url: string
  mimeType: string
  size: number
}

export interface Streams {
  display: MediaStream | null
  camera: MediaStream | null
}

export interface RequestPermissionsOptions {
  cameraEnabled?: boolean
  audioEnabled?: boolean
}

export interface StartOptions {
  audioEnabled?: boolean
}

export const getSupportedMimeType = (): string => {
  const types = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4'
  ]

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type
    }
  }

  return ''
}

export class ScreenRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private audioContext: AudioContext | null = null
  private streams: Streams = { display: null, camera: null }
  private mimeType: string | null = null
  private dataInterval: ReturnType<typeof setInterval> | null = null
  private state: RecorderState = 'idle'
  public onStateChange: ((state: RecorderState) => void) | null = null
  public onError: ((error: Error) => void) | null = null
  public onDataAvailable: ((data: Blob) => void) | null = null

  async requestPermissions(options: RequestPermissionsOptions = {}): Promise<Streams> {
    const { cameraEnabled = true, audioEnabled = true } = options
    
    try {
      this.state = 'requesting'
      this.notifyStateChange()

      // Capture tab/screen
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: audioEnabled
      })

      // Capture camera and audio if enabled
      let cameraStream: MediaStream | null = null
      if (cameraEnabled || audioEnabled) {
        cameraStream = await navigator.mediaDevices.getUserMedia({
          video: cameraEnabled,
          audio: audioEnabled
        })
      }

      this.streams = { display: displayStream, camera: cameraStream }
      this.state = 'idle'
      this.notifyStateChange()

      // Handle when user stops sharing via browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        this.stop()
      }

      return { display: displayStream, camera: cameraStream }
    } catch (err) {
      this.state = 'idle'
      this.notifyStateChange()
      const error = err instanceof Error ? err : new Error(String(err))
      if (this.onError) {
        this.onError(error)
      }
      throw error
    }
  }

  async start(options: StartOptions = {}): Promise<void> {
    const { audioEnabled = true } = options
    const { display, camera } = this.streams

    if (!display) {
      throw new Error('No display stream available. Call requestPermissions() first.')
    }

    const videoTrack = display.getVideoTracks()[0]
    if (!videoTrack || videoTrack.readyState !== 'live') {
      throw new Error('Display stream is not active')
    }

    this.recordedChunks = []
    this.state = 'recording'
    this.notifyStateChange()

    let combinedStream: MediaStream

    // If audio is enabled, mix audio from display and microphone
    if (audioEnabled) {
      const audioContext = new AudioContext()
      this.audioContext = audioContext
      const audioDestination = audioContext.createMediaStreamDestination()

      const displayAudioTracks = display.getAudioTracks()
      const micAudioTracks = camera ? camera.getAudioTracks() : []

      // Mix display/system audio
      if (displayAudioTracks.length > 0) {
        const displayAudioStream = new MediaStream(displayAudioTracks)
        const displaySource = audioContext.createMediaStreamSource(displayAudioStream)
        displaySource.connect(audioDestination)
      }

      // Mix microphone audio
      if (micAudioTracks.length > 0) {
        const micAudioStream = new MediaStream(micAudioTracks)
        const micSource = audioContext.createMediaStreamSource(micAudioStream)
        micSource.connect(audioDestination)
      }

      combinedStream = new MediaStream([
        ...display.getVideoTracks(),
        ...audioDestination.stream.getAudioTracks()
      ])
    } else {
      combinedStream = new MediaStream([
        ...display.getVideoTracks()
      ])
    }

    const supportedMimeType = getSupportedMimeType()
    this.mimeType = supportedMimeType

    const recorderOptions = supportedMimeType ? { mimeType: supportedMimeType } : {}
    this.mediaRecorder = new MediaRecorder(combinedStream, recorderOptions)

    return new Promise<void>((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder initialization failed'))
        return
      }

      this.mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data)
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data)
          }
        }
      }

      this.mediaRecorder.onerror = (event: Event) => {
        const errorEvent = event as MediaRecorderErrorEvent
        this.state = 'idle'
        this.notifyStateChange()
        const error = errorEvent.error || new Error('Unknown MediaRecorder error')
        if (this.onError) {
          this.onError(error)
        }
        reject(error)
      }

      this.mediaRecorder.onstop = () => {
        this.state = 'stopped'
        this.notifyStateChange()
        
        if (this.recordedChunks.length === 0) {
          reject(new Error('No recording data available'))
          return
        }

        const blobType = this.mimeType || this.mediaRecorder?.mimeType || 'video/webm'
        const blob = new Blob(this.recordedChunks, { type: blobType })

        if (blob.size === 0) {
          reject(new Error('Recording is empty'))
          return
        }

        // Clean up audio context
        if (this.audioContext) {
          this.audioContext.close()
          this.audioContext = null
        }

        resolve()
      }

      // Handle track ending
      videoTrack.onended = () => {
        this.stop()
      }

      this.mediaRecorder.start()

      // Set up periodic data requests
      this.dataInterval = setInterval(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          try {
            this.mediaRecorder.requestData()
          } catch (err) {
            console.warn('Error requesting data:', err)
            if (this.dataInterval) {
              clearInterval(this.dataInterval)
            }
          }
        } else {
          if (this.dataInterval) {
            clearInterval(this.dataInterval)
          }
        }
      }, 1000)

      resolve()
    })
  }

  pause(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
      this.state = 'paused'
      this.notifyStateChange()
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      this.state = 'recording'
      this.notifyStateChange()
    }
  }

  async stop(): Promise<RecordingResult | null> {
    return new Promise<RecordingResult | null>((resolve, reject) => {
      if (!this.mediaRecorder) {
        resolve(null)
        return
      }

      // Clear data interval
      if (this.dataInterval) {
        clearInterval(this.dataInterval)
        this.dataInterval = null
      }

      const recorder = this.mediaRecorder

      if (recorder.state === 'recording' || recorder.state === 'paused') {
        // Set up one-time resolve handler
        const originalOnStop = recorder.onstop
        recorder.onstop = () => {
          if (originalOnStop) originalOnStop()
          
          if (this.recordedChunks.length === 0) {
            reject(new Error('No recording data available'))
            return
          }

          const blobType = this.mimeType || recorder.mimeType || 'video/webm'
          const blob = new Blob(this.recordedChunks, { type: blobType })

          if (blob.size === 0) {
            reject(new Error('Recording is empty'))
            return
          }

          // Clean up audio context
          if (this.audioContext) {
            this.audioContext.close()
            this.audioContext = null
          }

          resolve({
            blob,
            url: URL.createObjectURL(blob),
            mimeType: blobType,
            size: blob.size
          })
        }

        if (recorder.state === 'recording') {
          recorder.requestData()
          setTimeout(() => {
            recorder.stop()
          }, 200)
        } else {
          recorder.stop()
        }
      } else {
        resolve(null)
      }
    })
  }

  toggleCamera(enabled: boolean): void {
    if (this.streams.camera) {
      this.streams.camera.getVideoTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  toggleAudio(enabled: boolean): void {
    if (this.streams.camera) {
      this.streams.camera.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }
    if (this.streams.display) {
      this.streams.display.getAudioTracks().forEach(track => {
        track.enabled = enabled
      })
    }
  }

  cleanup(): void {
    // Stop recorder
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }

    // Clear interval
    if (this.dataInterval) {
      clearInterval(this.dataInterval)
      this.dataInterval = null
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    // Stop all tracks
    if (this.streams.display) {
      this.streams.display.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
    }
    if (this.streams.camera) {
      this.streams.camera.getTracks().forEach(track => {
        if (track.readyState === 'live') {
          track.stop()
        }
      })
    }

    this.streams = { display: null, camera: null }
    this.state = 'idle'
    this.notifyStateChange()
  }

  // Restart recording without cleaning up streams (for use during capture sessions)
  async restartRecording(): Promise<void> {
    // Stop current MediaRecorder if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      // Clear data interval
      if (this.dataInterval) {
        clearInterval(this.dataInterval)
        this.dataInterval = null
      }
      
      // Stop the MediaRecorder
      await new Promise<void>((resolve) => {
        if (!this.mediaRecorder) {
          resolve()
          return
        }
        
        const originalOnStop = this.mediaRecorder.onstop
        this.mediaRecorder.onstop = () => {
          if (originalOnStop) originalOnStop()
          resolve()
        }
        
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.requestData()
          setTimeout(() => {
            this.mediaRecorder?.stop()
          }, 200)
        } else {
          this.mediaRecorder.stop()
        }
      })
    }

    // Cleanup MediaRecorder and audio context but preserve streams
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.recordedChunks = []
    this.mediaRecorder = null
    this.dataInterval = null
    this.state = 'idle'
    this.notifyStateChange()
  }

  notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.state)
    }
  }

  getState(): RecorderState {
    return this.state
  }

  getStreams(): Streams {
    return this.streams
  }
}
