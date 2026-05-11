import { useState } from "react"
import { Button, Input, Text, toast } from "@medusajs/ui"
import { sdk } from "../../../lib/client"

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]

// Hero image picker for gift guides. Supports both upload-from-disk and
// paste-a-URL — uploads land in the platform's configured file store via
// /admin/uploads and we save the returned URL the same way a manual paste
// would. URL input stays exposed (collapsed by default) so existing
// CDN-hosted hero images can still be wired up without re-uploading.
export const HeroImageInput = ({
  value,
  onChange,
}: {
  value: string
  onChange: (url: string) => void
}) => {
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)

  const handleFile = async (file: File) => {
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error(`Unsupported format: ${file.type || file.name}`)
      return
    }
    setUploading(true)
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] })
      const url = files?.[0]?.url
      if (!url) throw new Error("Upload returned no URL")
      onChange(url)
      toast.success("Image uploaded")
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so picking the same file twice still fires onChange.
    e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="flex items-start gap-3">
          <img
            src={value}
            alt="Hero preview"
            className="h-20 w-32 object-cover rounded border"
          />
          <div className="flex flex-col gap-1">
            <Text className="text-ui-fg-subtle text-xs break-all">
              {value}
            </Text>
            <Button
              variant="secondary"
              size="small"
              onClick={() => onChange("")}
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <label
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="bg-ui-bg-component border-ui-border-strong hover:border-ui-border-interactive flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed p-6 cursor-pointer transition"
        >
          <Text className="text-ui-fg-subtle text-sm">
            {uploading ? "Uploading…" : "Drop image here, or click to select"}
          </Text>
          <Text size="xsmall" className="text-ui-fg-muted">
            JPG, PNG, WEBP, GIF, SVG
          </Text>
          <input
            type="file"
            accept={SUPPORTED_FORMATS.join(",")}
            className="hidden"
            onChange={handleInputChange}
            disabled={uploading}
          />
        </label>
      )}

      <button
        type="button"
        onClick={() => setShowUrlInput((v) => !v)}
        className="text-ui-fg-subtle text-xs hover:text-ui-fg-base text-left"
      >
        {showUrlInput ? "Hide URL field" : "…or paste a URL"}
      </button>
      {showUrlInput && (
        <Input
          placeholder="https://… or /images/hero/easter.jpg"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}
