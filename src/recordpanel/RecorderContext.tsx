import { createContext, useContext } from 'react'
import type { RecorderState, RecordingResult, StartOptions } from './recorder'

export type Theme = 'light' | 'dark' | 'auto'

export interface RecorderConfig {
  theme?: Theme
  stopButtonText?: string
}

export interface RecorderAPI {
  show: () => void
  hide: () => void
  start: (options?: StartOptions) => Promise<void>
  pause: () => void
  resume: () => void
  stop: () => Promise<RecordingResult | null>
  restart: () => Promise<void>
  capture: (options?: StartOptions) => Promise<RecordingResult>
  getState: () => RecorderState
  isVisible: () => boolean
  isRecording: () => boolean
  isPaused: () => boolean
  getRecordingDuration: () => number // Returns duration in seconds
  setConfig: (config: RecorderConfig) => void
}

export const RecorderContext = createContext<RecorderAPI | null>(null)

export function useRecordPanel(): RecorderAPI {
  const context = useContext(RecorderContext)
  if (!context) {
    throw new Error('useRecordPanel must be used within RecordPanelHost')
  }
  return context
}
