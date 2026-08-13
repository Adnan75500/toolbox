import {
  Image as ImageIcon,
  FileText,
  Video,
  Music,
  Type,
  ShieldCheck,
  Code2,
  Calculator,
  Palette,
  type LucideIcon,
} from "lucide-react"

export type CategorySlug =
  | "image"
  | "pdf"
  | "video"
  | "audio"
  | "text"
  | "security"
  | "developer"
  | "calculators"
  | "design"

export interface ToolMeta {
  slug: string
  name: string
  description: string
  category: CategorySlug
  available: boolean
  keywords?: string[]
}

export interface CategoryMeta {
  slug: CategorySlug
  name: string
  description: string
  icon: LucideIcon
}

export const CATEGORIES: CategoryMeta[] = [
  {
    slug: "image",
    name: "Image",
    description: "Compress, resize, crop, convert and edit images",
    icon: ImageIcon,
  },
  {
    slug: "pdf",
    name: "PDF",
    description: "Merge, split, rotate and edit PDF documents",
    icon: FileText,
  },
  {
    slug: "video",
    name: "Video",
    description: "Trim, compress and convert video files",
    icon: Video,
  },
  {
    slug: "audio",
    name: "Audio",
    description: "Trim, convert and compress audio files",
    icon: Music,
  },
  {
    slug: "text",
    name: "Text",
    description: "Count, convert, compare and transform text",
    icon: Type,
  },
  {
    slug: "security",
    name: "Security",
    description: "Hash, encrypt, generate passwords and QR codes",
    icon: ShieldCheck,
  },
  {
    slug: "developer",
    name: "Developer",
    description: "Format, validate and convert data for developers",
    icon: Code2,
  },
  {
    slug: "calculators",
    name: "Calculators",
    description: "Everyday and financial calculators",
    icon: Calculator,
  },
  {
    slug: "design",
    name: "Design",
    description: "Generate cards, palettes, gradients and signatures",
    icon: Palette,
  },
]

export const TOOLS: ToolMeta[] = [
  // Image
  {
    slug: "image-compressor",
    name: "Image Compressor",
    description: "Reduce image file size while keeping quality.",
    category: "image",
    available: true,
    keywords: ["compress", "optimize", "shrink", "reduce size"],
  },
  {
    slug: "image-resizer",
    name: "Image Resizer",
    description: "Resize images to exact dimensions or by percentage.",
    category: "image",
    available: true,
    keywords: ["resize", "scale", "dimensions"],
  },
  {
    slug: "image-cropper",
    name: "Image Cropper",
    description: "Crop images with an interactive, adjustable frame.",
    category: "image",
    available: true,
    keywords: ["crop", "trim", "cut"],
  },
  {
    slug: "format-converter",
    name: "Format Converter",
    description: "Convert between JPG, PNG, WebP and BMP.",
    category: "image",
    available: true,
    keywords: ["convert", "jpg", "png", "webp", "bmp"],
  },
  {
    slug: "watermark-adder",
    name: "Watermark Adder",
    description: "Add a text watermark to protect your images.",
    category: "image",
    available: true,
    keywords: ["watermark", "overlay", "protect"],
  },
  {
    slug: "image-rotator",
    name: "Image Rotator & Flipper",
    description: "Rotate and flip images in any direction.",
    category: "image",
    available: true,
    keywords: ["rotate", "flip", "turn", "mirror", "orientation"],
  },
  {
    slug: "exif-viewer",
    name: "EXIF Viewer / Remover",
    description: "View and strip metadata from photos.",
    category: "image",
    available: true,
    keywords: ["exif", "metadata", "privacy", "strip", "clean", "camera"],
  },
  {
    slug: "image-base64",
    name: "Image Base64 Encoder",
    description: "Convert images to and from Base64.",
    category: "image",
    available: true,
    keywords: ["base64", "encode", "decode", "data url", "datauri"],
  },
  {
    slug: "color-picker",
    name: "Color Picker from Image",
    description: "Pick colors from any pixel of an image.",
    category: "image",
    available: true,
    keywords: ["color", "picker", "eyedropper", "hex", "rgb", "palette"],
  },
  {
    slug: "collage-maker",
    name: "Collage Maker",
    description: "Combine multiple images into a collage.",
    category: "image",
    available: true,
    keywords: ["collage", "combine", "grid", "photo grid", "montage"],
  },
  {
    slug: "meme-generator",
    name: "Meme Generator",
    description: "Add top and bottom captions to images.",
    category: "image",
    available: true,
    keywords: ["meme", "caption", "generator", "text", "impact"],
  },
  {
    slug: "svg-converter",
    name: "SVG to PNG / JPG",
    description: "Rasterize SVG files or turn images to vector.",
    category: "image",
    available: true,
    keywords: ["svg", "vector", "rasterize", "png", "jpg", "convert"],
  },
  {
    slug: "favicon-generator",
    name: "Favicon Generator",
    description: "Generate favicons in multiple sizes.",
    category: "image",
    available: true,
    keywords: ["favicon", "ico", "apple-touch-icon", "pwa", "icon"],
  },

  // PDF
  { slug: "merge-pdf", name: "Merge PDFs", description: "Combine multiple PDFs into one.", category: "pdf", available: true, keywords: ["merge", "combine", "join", "pdf"] },
  { slug: "split-pdf", name: "Split PDF", description: "Split a PDF by page ranges.", category: "pdf", available: true, keywords: ["split", "cut", "separate", "pages"] },
  { slug: "extract-pages", name: "Extract / Remove Pages", description: "Keep or delete specific pages.", category: "pdf", available: true, keywords: ["extract", "remove", "delete", "pages"] },
  { slug: "organize-pdf", name: "Organize Pages", description: "Reorder pages with drag and drop.", category: "pdf", available: true, keywords: ["organize", "reorder", "sort", "pages"] },
  { slug: "rotate-pdf", name: "Rotate Pages", description: "Rotate PDF pages.", category: "pdf", available: true, keywords: ["rotate", "turn", "orientation"] },
  { slug: "crop-pdf", name: "Crop Pages", description: "Crop the visible area of PDF pages.", category: "pdf", available: true, keywords: ["crop", "trim", "margins"] },
  { slug: "protect-pdf", name: "Password Protect", description: "Add or remove a PDF password.", category: "pdf", available: true, keywords: ["protect", "encrypt", "password", "security"] },
  { slug: "watermark-pdf", name: "Add Watermark", description: "Stamp text or image watermarks.", category: "pdf", available: true, keywords: ["watermark", "stamp", "overlay"] },
  { slug: "page-numbers", name: "Add Page Numbers", description: "Insert page numbers into a PDF.", category: "pdf", available: true, keywords: ["page numbers", "numbering", "footer", "header"] },
  { slug: "header-footer", name: "Header & Footer", description: "Add headers and footers to a PDF.", category: "pdf", available: true, keywords: ["header", "footer", "text", "stamp"] },
  { slug: "pdf-metadata", name: "Edit Metadata", description: "Edit title, author and more.", category: "pdf", available: true, keywords: ["metadata", "title", "author", "subject", "properties"] },
  { slug: "compress-pdf", name: "Compress PDF", description: "Recompress embedded images.", category: "pdf", available: true, keywords: ["compress", "shrink", "optimize", "reduce size"] },
  { slug: "extract-images", name: "Extract Images", description: "Pull images out of a PDF.", category: "pdf", available: true, keywords: ["extract images", "export photos", "images"] },
  { slug: "extract-text", name: "Extract Text", description: "Extract text content from a PDF.", category: "pdf", available: true, keywords: ["extract text", "read text", "copy text", "txt"] },
  { slug: "pdf-to-image", name: "PDF to JPG / PNG", description: "Render PDF pages as images.", category: "pdf", available: true, keywords: ["pdf to jpg", "pdf to png", "rasterize", "render"] },
  { slug: "image-to-pdf", name: "Images to PDF", description: "Combine images into a PDF.", category: "pdf", available: true, keywords: ["jpg to pdf", "png to pdf", "convert images"] },
  { slug: "pdf-info", name: "PDF Info Viewer", description: "View page count and basic info.", category: "pdf", available: true, keywords: ["info", "inspect", "pages", "details"] },

  // Video
  { slug: "video-trimmer", name: "Video Trimmer", description: "Cut and trim video clips.", category: "video", available: true, keywords: ["trim", "cut", "crop", "clip", "video"] },
  { slug: "video-compressor", name: "Video Compressor", description: "Reduce video file size.", category: "video", available: true, keywords: ["compress", "shrink", "reduce size", "video"] },
  { slug: "video-converter", name: "Video Converter", description: "Convert MP4, WebM and MOV.", category: "video", available: true, keywords: ["convert", "mp4", "webm", "format"] },
  { slug: "extract-audio", name: "Extract Audio", description: "Pull the audio track from a video.", category: "video", available: true, keywords: ["extract audio", "mp3", "wav", "sound", "track"] },
  { slug: "video-to-gif", name: "Video to GIF", description: "Turn clips into animated GIFs.", category: "video", available: true, keywords: ["gif", "animated", "webp", "clip"] },
  { slug: "screen-recorder", name: "Screen Recorder", description: "Record your screen locally.", category: "video", available: true, keywords: ["record", "screen", "capture", "display", "webcam"] },

  // Audio
  { slug: "audio-trimmer", name: "Audio Trimmer", description: "Cut and trim audio clips.", category: "audio", available: false },
  { slug: "audio-converter", name: "Audio Converter", description: "Convert MP3, WAV and OGG.", category: "audio", available: false },
  { slug: "audio-compressor", name: "Audio Compressor", description: "Reduce audio file size.", category: "audio", available: false },

  // Text
  { slug: "word-counter", name: "Word & Character Counter", description: "Count words, characters and lines.", category: "text", available: false },
  { slug: "case-converter", name: "Case Converter", description: "Convert text case styles.", category: "text", available: false },
  { slug: "diff-checker", name: "Text Diff Checker", description: "Compare two texts side by side.", category: "text", available: false },
  { slug: "duplicate-remover", name: "Duplicate Line Remover", description: "Remove repeated lines.", category: "text", available: false },
  { slug: "lorem-ipsum", name: "Lorem Ipsum Generator", description: "Generate placeholder text.", category: "text", available: false },
  { slug: "markdown-to-html", name: "Markdown to HTML", description: "Convert Markdown to HTML.", category: "text", available: false },
  { slug: "text-to-pdf", name: "Text to PDF", description: "Turn text into a PDF file.", category: "text", available: false },

  // Security
  { slug: "password-generator", name: "Password Generator", description: "Generate strong passwords.", category: "security", available: false },
  { slug: "password-strength", name: "Password Strength", description: "Check how strong a password is.", category: "security", available: false },
  { slug: "hash-generator", name: "Hash Generator", description: "Generate MD5 and SHA hashes.", category: "security", available: false },
  { slug: "base64-text", name: "Base64 Encoder", description: "Encode and decode Base64 text.", category: "security", available: false },
  { slug: "url-encoder", name: "URL Encoder", description: "Encode and decode URLs.", category: "security", available: false },
  { slug: "qr-generator", name: "QR Code Generator", description: "Create QR codes from text.", category: "security", available: false },
  { slug: "qr-scanner", name: "QR Code Scanner", description: "Scan QR codes from images.", category: "security", available: false },
  { slug: "file-encryption", name: "File Encryption", description: "Encrypt and decrypt files with AES.", category: "security", available: false },

  // Developer
  { slug: "json-formatter", name: "JSON Formatter", description: "Format and validate JSON.", category: "developer", available: false },
  { slug: "minifier", name: "CSS / JS Minifier", description: "Minify and beautify code.", category: "developer", available: false },
  { slug: "regex-tester", name: "Regex Tester", description: "Test regular expressions live.", category: "developer", available: false },
  { slug: "uuid-generator", name: "UUID Generator", description: "Generate unique identifiers.", category: "developer", available: false },
  { slug: "color-converter", name: "Color Converter", description: "Convert HEX, RGB and HSL.", category: "developer", available: false },
  { slug: "csv-to-json", name: "CSV to JSON", description: "Convert CSV data to JSON.", category: "developer", available: false },
  { slug: "json-to-csv", name: "JSON to CSV", description: "Convert JSON data to CSV.", category: "developer", available: false },
  { slug: "xml-formatter", name: "XML Formatter", description: "Format and beautify XML.", category: "developer", available: false },

  // Calculators
  { slug: "unit-converter", name: "Unit Converter", description: "Convert length, weight and more.", category: "calculators", available: false },
  { slug: "bmi-calculator", name: "BMI Calculator", description: "Calculate body mass index.", category: "calculators", available: false },
  { slug: "age-calculator", name: "Age Calculator", description: "Calculate exact age.", category: "calculators", available: false },
  { slug: "percentage-calculator", name: "Percentage Calculator", description: "Work out percentages.", category: "calculators", available: false },
  { slug: "loan-calculator", name: "Loan / EMI Calculator", description: "Estimate loan repayments.", category: "calculators", available: false },
  { slug: "date-difference", name: "Date Difference", description: "Days between two dates.", category: "calculators", available: false },

  // Design
  { slug: "business-card", name: "Business Card Generator", description: "Design and export business cards.", category: "design", available: false },
  { slug: "invoice-generator", name: "Invoice Generator", description: "Create and export invoices.", category: "design", available: false },
  { slug: "palette-generator", name: "Color Palette Generator", description: "Generate color palettes.", category: "design", available: false },
  { slug: "gradient-generator", name: "CSS Gradient Generator", description: "Build CSS gradients.", category: "design", available: false },
  { slug: "signature-pad", name: "Signature Pad", description: "Draw and export a signature.", category: "design", available: false },
]

export function getCategory(slug: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.slug === slug)
}

export function getToolsByCategory(slug: string): ToolMeta[] {
  return TOOLS.filter((t) => t.category === slug)
}

export function getTool(category: string, slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.category === category && t.slug === slug)
}

export function getToolBySlug(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug)
}

export function searchTools(query: string): ToolMeta[] {
  const q = query.trim().toLowerCase()
  if (!q) return TOOLS
  return TOOLS.filter((t) => {
    const haystack = [t.name, t.description, t.category, ...(t.keywords ?? [])]
      .join(" ")
      .toLowerCase()
    return haystack.includes(q)
  })
}

export const TOTAL_TOOL_COUNT = TOOLS.length
export const AVAILABLE_TOOL_COUNT = TOOLS.filter((t) => t.available).length
