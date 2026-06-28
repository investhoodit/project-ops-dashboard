"use client"

import { useCallback, useEffect, useState } from "react"
import { useDashboard } from "@/lib/dashboard-context"
import { useSpeechRecognition } from "./use-speech-recognition"
import { useSpeechSynthesis } from "./use-speech-synthesis"

type Mode = "dashboard" | "general" | "web" | "local"
type Provider = "openai" | "gateway" | "local"

interface Source {
  title: string
  url: string
}

const MODE_LABEL: Record<Mode, string> = {
  dashboard: "Dashboard Context",
  general: "AI General Knowledge",
  web: "Web Search Used",
  local: "Local Fallback",
}
const PROVIDER_LABEL: Record<Provider, string> = {
  openai: "OpenAI Direct",
  gateway: "Vercel AI Gateway",
  local: "Local Fallback",
}

const QUICK_COMMANDS = [
  "What must I do today?",
  "Read my overdue tasks.",
  "What opportunities are closing soon?",
  "Summarise high-risk projects.",
  "What appointments do I have today?",
  "What should I focus on first?",
]

interface Props {
  onClose: () => void
}

export function VoiceAssistantModal({ onClose }: Props) {
  const { data } = useDashboard()
  const recognition = useSpeechRecognition()
  const synthesis = useSpeechSynthesis()

  const [answer, setAnswer] = useState("")
  const [mode, setMode] = useState<Mode | null>(null)
  const [provider, setProvider] = useState<Provider | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(false)

  // Close on Escape and stop any audio/listening.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  const askAssistant = useCallback(
    async (question: string) => {
      const trimmed = question.trim()
      if (!trimmed) return
      recognition.stop()
      setLoading(true)
      setAnswer("Thinking...")
      setMode(null)
      setProvider(null)
      setSources([])
      setNotice("")
      try {
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: trimmed, data }),
        })
        const json = await res.json()
        setAnswer(json.answer || "No answer returned.")
        setMode((json.mode as Mode) || null)
        setProvider((json.provider as Provider) || null)
        setSources(Array.isArray(json.sources) ? json.sources : [])
        setNotice(typeof json.notice === "string" ? json.notice : "")
      } catch {
        setAnswer("Could not reach the assistant service. Please try again.")
        setMode("local")
        setProvider("local")
      } finally {
        setLoading(false)
      }
    },
    [data, recognition],
  )

  function handleQuickCommand(command: string) {
    recognition.setTranscript(command)
    askAssistant(command)
  }

  function handleClose() {
    recognition.stop()
    synthesis.stop()
    onClose()
  }

  const transcript = recognition.transcript

  return (
    <div
      role="presentation"
      className="voice-overlay"
      onClick={handleClose}
    >
      <div
        className="voice-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Ask by voice"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="voice-modal-head">
          <div>
            <p className="eyebrow" style={{ color: "var(--muted)", margin: 0 }}>
              Voice Assistant
            </p>
            <h2>Ask by Voice</h2>
          </div>
          <button className="voice-close" type="button" onClick={handleClose} aria-label="Close voice assistant">
            ×
          </button>
        </div>

        {!recognition.supported ? (
          <p className="voice-unsupported" role="status">
            Voice input is not supported on this browser. Please type your question instead.
          </p>
        ) : (
          <div className="voice-controls">
            {recognition.listening ? (
              <button className="btn voice-mic-btn listening" type="button" onClick={recognition.stop}>
                <span className="voice-pulse" aria-hidden="true" />
                Stop Listening
              </button>
            ) : (
              <button className="btn voice-mic-btn" type="button" onClick={recognition.start}>
                <MicIcon />
                Start Listening
              </button>
            )}
          </div>
        )}

        <label className="voice-transcript-label" htmlFor="voice-transcript">
          Transcript
        </label>
        <textarea
          id="voice-transcript"
          className="voice-transcript"
          rows={3}
          value={transcript}
          onChange={(e) => recognition.setTranscript(e.target.value)}
          placeholder={
            recognition.supported
              ? "Tap Start Listening and speak, or type your question here…"
              : "Type your question here…"
          }
        />

        <div className="voice-action-row">
          <button
            className="btn"
            type="button"
            onClick={() => askAssistant(transcript)}
            disabled={loading || !transcript.trim()}
          >
            {loading ? "Asking…" : "Send to Assistant"}
          </button>
          {recognition.transcript && (
            <button className="btn ghost voice-ghost" type="button" onClick={recognition.reset} disabled={loading}>
              Clear
            </button>
          )}
        </div>

        <div className="voice-quick">
          <p className="voice-quick-title">Quick commands</p>
          <div className="voice-quick-grid">
            {QUICK_COMMANDS.map((command) => (
              <button
                key={command}
                type="button"
                className="voice-quick-btn"
                onClick={() => handleQuickCommand(command)}
                disabled={loading}
              >
                {command}
              </button>
            ))}
          </div>
        </div>

        {answer && (
          <div className="voice-response-block">
            <div className="voice-response">{answer}</div>

            {(provider || mode) && !loading && (
              <div className="ai-chips">
                {provider && <span className={`ai-mode-chip ai-provider-${provider}`}>{PROVIDER_LABEL[provider]}</span>}
                {mode && <span className={`ai-mode-chip ai-mode-${mode}`}>{MODE_LABEL[mode]}</span>}
              </div>
            )}

            {notice && !loading && (
              <p className="ai-notice" role="status">
                {notice}
              </p>
            )}

            {sources.length > 0 && !loading && (
              <div className="ai-sources">
                <strong>Sources</strong>
                {sources.map((s) => (
                  <a key={s.url} className="ai-source-link" href={s.url} target="_blank" rel="noopener noreferrer">
                    {s.title}
                  </a>
                ))}
              </div>
            )}

            {synthesis.supported && !loading && answer !== "Thinking..." && (
              <div className="voice-action-row">
                {synthesis.speaking ? (
                  <button className="btn secondary" type="button" onClick={synthesis.stop}>
                    Stop Speaking
                  </button>
                ) : (
                  <button className="btn secondary" type="button" onClick={() => synthesis.speak(answer)}>
                    Read Response Aloud
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {recognition.error && recognition.error !== "unsupported" && (
          <p className="voice-error" role="alert">
            Microphone error: {recognition.error}. Check that your browser has microphone permission.
          </p>
        )}

        <p className="voice-privacy">Audio is processed in your browser. Recordings are not stored.</p>
      </div>
    </div>
  )
}

function MicIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  )
}
