"use client"

import { useState, useRef, useEffect } from "react"
import { Video, Mic, MicOff, StopCircle, Download, Play, Pause, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function ScreenRecorder() {
  const [recording, setRecording] = useState<boolean>(false)
  const [micEnabled, setMicEnabled] = useState<boolean>(false)
  const [timerSeconds, setTimerSeconds] = useState<number>(0)

  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerIntervalRef = useRef<any>(null)
  const previewVideoRef = useRef<HTMLVideoElement | null>(null)

  function reset() {
    stopRecording()
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedBlob(null)
    setRecordedUrl(null)
    setTimerSeconds(0)
  }

  async function startRecording() {
    setRecordedBlob(null)
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)

    try {
      // Prompt user to select screen, window, or tab
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: true,
      })

      let finalStream = displayStream

      // Add Microphone audio track if enabled
      if (micEnabled) {
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const dest = audioContext.createMediaStreamDestination()

          displayStream.getAudioTracks().forEach((track) => {
            const source = audioContext.createMediaStreamSource(new MediaStream([track]))
            source.connect(dest)
          })

          micStream.getAudioTracks().forEach((track) => {
            const source = audioContext.createMediaStreamSource(new MediaStream([track]))
            source.connect(dest)
          })

          finalStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks(),
          ])
        } catch {
          toast.info("Microphone permission denied; recording display audio only.")
        }
      }

      streamRef.current = finalStream
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm"

      const recorder = new MediaRecorder(finalStream, { mimeType: mime })
      mediaRecorderRef.current = recorder
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        setRecordedBlob(blob)
        setRecordedUrl(URL.createObjectURL(blob))
        setRecording(false)
        clearInterval(timerIntervalRef.current)
        toast.success("Screen recording finished!")
      }

      // Stop recording automatically when user stops screen share from browser banner
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording()
      }

      recorder.start(1000)
      setRecording(true)
      setTimerSeconds(0)

      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1)
      }, 1000)

      toast.success("Screen recording started!")
    } catch {
      toast.error("Screen recording permission was cancelled or not supported.")
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    clearInterval(timerIntervalRef.current)
    setRecording(false)
  }

  useEffect(() => {
    return () => {
      stopRecording()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Control Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Video className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Local Screen & Audio Recorder</h3>
            <p className="text-xs text-muted-foreground">
              Record your entire screen, application window, or browser tab locally
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={micEnabled ? "default" : "outline"}
            onClick={() => setMicEnabled(!micEnabled)}
            disabled={recording}
          >
            {micEnabled ? <Mic className="size-4 mr-1.5" /> : <MicOff className="size-4 mr-1.5" />}
            {micEnabled ? "Mic Audio: On" : "Mic Audio: Off"}
          </Button>

          {recordedUrl && (
            <Button size="sm" variant="ghost" onClick={reset}>
              <RotateCcw className="size-4 mr-1.5" /> New Recording
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Recording Trigger */}
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 space-y-6 text-center min-h-[280px]">
          {recording ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className="size-3.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-mono text-2xl font-bold text-red-500">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">Recording active. Click below to stop.</p>
              <Button size="lg" variant="destructive" onClick={stopRecording} className="w-full">
                <StopCircle className="size-5 mr-2" /> Stop Recording
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Video className="size-12 text-primary/80 mx-auto" />
              <div>
                <h4 className="font-semibold text-base">Start Screen Recording</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Captures HD video & audio directly in your browser without software installation
                </p>
              </div>
              <Button size="lg" onClick={startRecording} className="w-full">
                <Play className="size-5 mr-2" /> Start Recording Screen
              </Button>
            </div>
          )}
        </div>

        {/* Right Side: Recorded Video Preview & Download */}
        <div className="space-y-4">
          <div className="aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {recordedUrl ? (
              <video
                ref={previewVideoRef}
                src={recordedUrl}
                controls
                className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
              />
            ) : (
              <span className="text-xs text-muted-foreground">Recorded video preview will appear here</span>
            )}
          </div>

          {recordedBlob && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => downloadBlob(recordedBlob, `screen-recording-${Date.now()}.webm`)}
            >
              <Download className="size-4 mr-2" /> Download Recording ({formatBytes(recordedBlob.size)})
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTimer(totalSecs: number): string {
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
