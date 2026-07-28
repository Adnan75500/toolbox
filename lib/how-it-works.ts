interface Step {
  title: string
  body: string
}

export const DEFAULT_HOW_IT_WORKS: Step[] = [
  { title: "Add your file", body: "Drag and drop or browse to select a file from your device." },
  { title: "Adjust options", body: "Tweak the settings to get exactly the result you want." },
  { title: "Download", body: "Save the processed file. It never left your browser." },
]

export const HOW_IT_WORKS: Record<string, Step[]> = {
  "image-compressor": [
    { title: "Upload an image", body: "Drop in a JPG, PNG or WebP file from your device." },
    { title: "Pick a target size", body: "Choose a max file size and quality; we compress in-browser." },
    { title: "Download the result", body: "Grab the smaller image — the original never leaves your device." },
  ],
  "image-resizer": [
    { title: "Upload an image", body: "Add any common image format." },
    { title: "Set dimensions", body: "Enter exact pixels or scale by percentage, locking aspect ratio if you like." },
    { title: "Download", body: "Export the resized image rendered with the Canvas API." },
  ],
  "image-cropper": [
    { title: "Upload an image", body: "Add the photo you want to crop." },
    { title: "Frame your crop", body: "Drag and zoom the crop box, or pick a fixed aspect ratio." },
    { title: "Download", body: "Export just the cropped region as a new image." },
  ],
  "format-converter": [
    { title: "Upload an image", body: "Add a JPG, PNG, WebP or BMP file." },
    { title: "Choose a format", body: "Select the output format and quality." },
    { title: "Download", body: "Save the converted image, drawn locally on a canvas." },
  ],
  "watermark-adder": [
    { title: "Upload an image", body: "Add the image you want to protect." },
    { title: "Style your watermark", body: "Type your text and adjust size, opacity, color and position." },
    { title: "Download", body: "Export the watermarked image processed in your browser." },
  ],
}
