"use client"

import { useCallback, useEffect, useState } from "react"

interface UseSpeechSynthesis {
  supported: boolean
  speaking: boolean
  speak: (text: string) => void
  stop: () => void
}

// Wraps the browser's speechSynthesis (text-to-speech). Feature-detected so the
// app never crashes on browsers without support. No audio is recorded or stored.
export function useSpeechSynthesis(): UseSpeechSynthesis {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window)
  }, [])

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return
      const trimmed = text.trim()
      if (!trimmed) return
      // Cancel anything already queued so taps don't stack up.
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(trimmed)
      utterance.rate = 1
      utterance.pitch = 1
      utterance.lang = "en-ZA"
      utterance.onend = () => setSpeaking(false)
      utterance.onerror = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utterance)
    },
    [],
  )

  // Stop any speech if the component using this hook unmounts.
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return { supported, speaking, speak, stop }
}
