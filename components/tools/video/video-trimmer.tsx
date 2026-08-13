"use client"

import { useState, useRef, useEffect } from "react"
import { Scissors, Download, Play, Pause, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function VideoTrimmer() {
  const [file, setFile] = useState<File | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState<number>(0)
  const [startTime, setStartTime] = useState<number>(0)
  const [endTime, setEndTime] = useState<number>(0)
  const [isPlaying, setIsPlaying] = useState<boolean>(false)

  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null)
  const [trimmedUrl, setTrimmedUrl] = useState<string | null>(null)
  const [processing, setProcessing] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)

  function reset() {
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    if (trimmedUrl) URL.revokeObjectURL(trimmedUrl)
    setFile(null)
    setVideoUrl(null)
    setDuration(0)
    setStartTime(0)
    setEndTime(0)
    setTrimmedBlob(null)
    setTrimmedUrl(null)
    setIsPlaying(false)
  }

  function onFiles(files: File[]) {
    const f = files[0]
    if (!f.type.startsWith("video/")) {
      toast.error("Please upload a valid video file.")
      return
    }
    reset()
    setFile(f)
    setVideoUrl(URL.createObjectURL(f))
  }

  function handleLoadedMetadata() {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      setDuration(dur)
      setEndTime(dur)
    }
  }

  function togglePlay() {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
      setIsPlaying(false)
    } else {
      videoRef.current.currentTime = startTime
      videoRef.current.play()
      setIsPlaying(true)
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleTimeUpdate = () => {
      if (video.currentTime >= endTime) {
        video.pause()
        setIsPlaying(false)
        video.currentTime = startTime
      }
    }
    video.addEventListener("timeupdate", handleTimeUpdate)
    return () => video.removeEventListener("timeupdate", handleTimeUpdate)
  }, [startTime, endTime])

  async function processTrim() {
    if (!videoRef.current || !videoUrl || endTime <= startTime) return
    setProcessing(true)
    setTrimmedBlob(null)

    try {
      const video = videoRef.current
      video.currentTime = startTime
      await new Promise((r) => setTimeout(r, 200))

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 360
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const stream = canvas.captureStream(30)
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" })
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "video/webm" })
        setTrimmedBlob(blob)
        if (trimmedUrl) URL.revokeObjectURL(trimmedUrl)
        setTrimmedUrl(URL.createObjectURL(blob))
        setProcessing(false)
        toast.success("Video trimmed successfully!")
      }

      recorder.start()
      video.play()

      const checkTrimEnd = setInterval(() => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        if (video.currentTime >= endTime || video.paused) {
          clearInterval(checkTrimEnd)
          video.pause()
          recorder.stop()
        }
      }, 1000 / 30)
    } catch {
      toast.error("An error occurred while trimming the video.")
      setProcessing(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept="video/*"
        onFiles={onFiles}
        label="Drop a video file to trim start and end clips"
        hint="MP4, WebM, MOV, AVI — Processed 100% locally in your browser"
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* File Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="font-semibold text-sm">{file.name}</h3>
          <p className="text-xs text-muted-foreground">
            Duration: {formatTime(duration)} • {formatBytes(file.size)}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Video Player & Sliders */}
        <div className="space-y-5 rounded-xl border border-border bg-card p-5">
          <div className="aspect-video relative overflow-hidden rounded-xl bg-black flex items-center justify-center">
            {videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                onLoadedMetadata={handleLoadedMetadata}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button size="sm" variant="outline" onClick={togglePlay}>
              {isPlaying ? <Pause className="size-4 mr-1.5" /> : <Play className="size-4 mr-1.5" />}
              {isPlaying ? "Pause Trimmed Range" : "Preview Trim Range"}
            </Button>
            <span className="font-mono text-xs text-muted-foreground">
              {formatTime(startTime)} – {formatTime(endTime)} (Clip: {formatTime(endTime - startTime)})
            </span>
          </div>

          {/* Start Time Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Start Timestamp</span>
              <span className="font-mono">{formatTime(startTime)}</span>
            </div>
            <Slider
              value={[startTime]}
              min={0}
              max={Math.max(0, endTime - 0.5)}
              step={0.1}
              onValueChange={(v) => {
                setStartTime(v[0])
                if (videoRef.current) videoRef.current.currentTime = v[0]
              }}
            />
          </div>

          {/* End Time Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>End Timestamp</span>
              <span className="font-mono">{formatTime(endTime)}</span>
            </div>
            <Slider
              value={[endTime]}
              min={startTime + 0.5}
              max={duration || 100}
              step={0.1}
              onValueChange={(v) => {
                setEndTime(v[0])
                if (videoRef.current) videoRef.current.currentTime = v[0]
              }}
            />
          </div>

          <Button onClick={processTrim} disabled={processing} className="w-full">
            {processing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Scissors className="size-4 mr-2" />}
            {processing ? "Trimming Video..." : "Trim & Export Video Clip"}
          </Button>
        </div>

        {/* Right: Output Preview & Download */}
        <div className="space-y-4">
          <div className="aspect-video flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-2">
            {trimmedUrl ? (
              <video src={trimmedUrl} controls className="max-h-full max-w-full object-contain rounded-lg shadow-xs" />
            ) : (
              <span className="text-xs text-muted-foreground">Trimmed video output preview will appear here</span>
            )}
          </div>

          {trimmedBlob && (
            <Button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => downloadBlob(trimmedBlob, `trimmed-${file.name.replace(/\.[^/.]+$/, "")}.webm`)}
            >
              <Download className="size-4 mr-2" /> Download Trimmed Clip ({formatBytes(trimmedBlob.size)})
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "00:00"
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms}`
}
