export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on next tick so the download can start.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`
}

export function replaceExtension(filename: string, ext: string): string {
  const base = filename.replace(/\.[^./\\]+$/, "")
  return `${base}.${ext.replace(/^\./, "")}`
}
