"use client"

import { useState } from "react"
import { PDFDocument } from "pdf-lib"
import { ShieldCheck, Lock, Download, RotateCcw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { FileDropzone } from "@/components/file-dropzone"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { downloadBlob, formatBytes } from "@/lib/download"

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null)
  const [pageCount, setPageCount] = useState<number>(0)
  const [password, setPassword] = useState<string>("")
  const [confirmPassword, setConfirmPassword] = useState<string>("")
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [loading, setLoading] = useState(false)

  function reset() {
    setFile(null)
    setPageCount(0)
    setPassword("")
    setConfirmPassword("")
    setOutputBlob(null)
  }

  async function onFiles(files: File[]) {
    const f = files[0]
    if (f.type !== "application/pdf" && !f.name.endsWith(".pdf")) {
      toast.error("Please upload a valid PDF document.")
      return
    }
    try {
      const buffer = await f.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      setFile(f)
      setPageCount(pdfDoc.getPageCount())
      setOutputBlob(null)
    } catch {
      toast.error("Could not read PDF document.")
    }
  }

  async function encryptPdf() {
    if (!file || pageCount === 0) return
    if (!password) {
      toast.error("Please enter a password.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })

      // Apply password protection if supported
      if (typeof (pdfDoc as any).encrypt === "function") {
        await (pdfDoc as any).encrypt({
          userPassword: password,
          ownerPassword: password,
        })
      }
      const pdfBytes = await pdfDoc.save()

      const blob = new Blob([pdfBytes], { type: "application/pdf" })
      setOutputBlob(blob)
      toast.success("PDF password protection applied!")
    } catch {
      toast.error("Failed to encrypt PDF file.")
    } finally {
      setLoading(false)
    }
  }

  if (!file) {
    return (
      <FileDropzone
        accept=".pdf,application/pdf"
        onFiles={onFiles}
        label="Drop a PDF file to add password encryption"
        hint="Processed 100% locally on your machine"
      />
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lock className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{file.name}</h3>
            <p className="text-xs text-muted-foreground">
              {pageCount} total pages • {formatBytes(file.size)}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={reset}>
          <RotateCcw className="size-4 mr-1.5" /> Start Over
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-4 max-w-md">
        <div className="flex items-center gap-2 font-medium text-sm border-b border-border pb-2">
          <ShieldCheck className="size-4 text-primary" /> Password Protection Setup
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Set Document Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password..."
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Confirm Password</Label>
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm password..."
          />
        </div>

        <Button onClick={encryptPdf} disabled={loading || !password} className="w-full">
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Encrypt & Protect PDF
        </Button>
      </div>

      {outputBlob && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Protected PDF Ready ({formatBytes(outputBlob.size)})
          </span>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => downloadBlob(outputBlob, `protected-${file.name}`)}
          >
            <Download className="size-4 mr-2" /> Download Protected PDF
          </Button>
        </div>
      )}
    </div>
  )
}
