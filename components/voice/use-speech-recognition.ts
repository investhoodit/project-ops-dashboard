"use client"

import { useCallback, useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------------------
// Minimal Web Speech API typings. These interfaces are not part of the
// standard DOM lib, so we declare just what we use and feature-detect at runtime.
// ---------------------------------------------------------------------------
interface SpeechRecognitionAlternativeLike {
  transcript: string
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike
  isFinal: boolean
  length: number
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: {
    length: number
    [index: number]: SpeechRecognitionResultLike
  }
}
interface SpeechRecognitionErrorEventLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
  return w.SpeechRecognition || w.webkitSpeechRecognition || null
}

interface UseSpeechRecognition {
  supported: boolean
  listening: boolean
  transcript: string
  error: string | null
  start: () => void
  stop: () => void
  reset: () => void
  setTranscript: (text: string) => void
}

export function useSpeechRecognition(lang = "en-ZA"): UseSpeechRecognition {
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const finalRef = useRef("")

  // Feature-detect on mount only (avoids SSR crashes).
  useEffect(() => {
    setSupported(getRecognitionCtor() !== null)
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      setError("unsupported")
      return
    }
    // Tear down any existing instance before starting a fresh session.
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort()
      } catch {
        /* ignore */
      }
    }
    const recognition = new Ctor()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    finalRef.current = ""
    setTranscript("")
    setError(null)

    recognition.onresult = (event) => {
      let interim = ""
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0]?.transcript ?? ""
        if (result.isFinal) {
          finalRef.current += text
        } else {
          interim += text
        }
      }
      setTranscript((finalRef.current + interim).trim())
    }
    recognition.onerror = (event) => {
      // "no-speech" / "aborted" are non-fatal; surface others.
      if (event.error !== "no-speech" && event.error !== "aborted") {
        setError(event.error || "error")
      }
    }
    recognition.onend = () => {
      setListening(false)
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setListening(true)
    } catch {
      // start() throws if called while already running; ignore.
      setListening(true)
    }
  }, [lang])

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (recognition) {
      try {
        recognition.stop()
      } catch {
        /* ignore */
      }
    }
    setListening(false)
  }, [])

  const reset = useCallback(() => {
    finalRef.current = ""
    setTranscript("")
    setError(null)
  }, [])

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current
      if (recognition) {
        try {
          recognition.abort()
        } catch {
          /* ignore */
        }
      }
    }
  }, [])

  return { supported, listening, transcript, error, start, stop, reset, setTranscript }
}
