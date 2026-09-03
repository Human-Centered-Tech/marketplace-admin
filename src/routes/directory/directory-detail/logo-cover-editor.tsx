import { useState } from "react"
import { Container, Heading, Text, Button, toast } from "@medusajs/ui"
import { sdk } from "../../../lib/client"
import { useUpdateDirectoryListing } from "../../../hooks/api/directory"

const SUPPORTED_FORMATS = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/avif",
]

const normalize = (u?: string | null) =>
  u && u.startsWith("//") ? `https:${u}` : u || ""

/**
 * Admin editor for a listing's LOGO + COVER images (Brooke 7/6: "ability for
 * admin to upload directory listing photos"). The gallery editor already
 * covers gallery_urls; this covers logo_url + cover_image_url, which vendors
 * set from their dashboard but admins previously couldn't. Same upload path
 * (sdk.admin.upload.create → /admin/uploads) + PUT /admin/directory/listings/:id.
 */
export const LogoCoverEditor = ({ listing }: { listing: any }) => {
  const update = useUpdateDirectoryListing()

  const [logo, setLogo] = useState<string>(listing.logo_url ?? "")
  const [cover, setCover] = useState<string>(listing.cover_image_url ?? "")
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null)
  const [savedBanner, setSavedBanner] = useState(false)

  const dirty =
    logo !== (listing.logo_url ?? "") || cover !== (listing.cover_image_url ?? "")

  const upload = async (
    which: "logo" | "cover",
    fileList: FileList | null
  ) => {
    const file = fileList?.[0]
    if (!file) return
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      toast.error(`Unsupported format: ${file.type || file.name}`)
      return
    }
    setUploading(which)
    try {
      const { files } = await sdk.admin.upload.create({ files: [file] })
      const url = (files ?? [])[0]?.url
      if (!url) throw new Error("Upload returned no URL")
      if (which === "logo") setLogo(url)
      else setCover(url)
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    } finally {
      setUploading(null)
    }
  }

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        id: listing.id,
        logo_url: logo || null,
        cover_image_url: cover || null,
      })
      setSavedBanner(true)
      setTimeout(() => setSavedBanner(false), 2500)
    } catch (e: any) {
      toast.error(e?.message || "Could not save images.")
    }
  }

  const Slot = ({
    label,
    which,
    value,
    onClear,
    aspect,
  }: {
    label: string
    which: "logo" | "cover"
    value: string
    onClear: () => void
    aspect: string
  }) => (
    <div>
      <Text size="small" weight="plus" className="mb-1">
        {label}
      </Text>
      <div
        className={`relative ${aspect} rounded border overflow-hidden bg-ui-bg-subtle`}
      >
        {value ? (
          <>
            <img
              src={normalize(value)}
              alt={label}
              className="w-full h-full object-contain bg-white"
            />
            <button
              type="button"
              onClick={onClear}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-sm leading-none flex items-center justify-center hover:bg-black/80"
            >
              ×
            </button>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Text className="text-ui-fg-muted text-xs">No {label.toLowerCase()}</Text>
          </div>
        )}
      </div>
      <label className="inline-block mt-2 cursor-pointer">
        <span className="text-ui-fg-interactive text-sm hover:underline">
          {uploading === which
            ? "Uploading…"
            : value
              ? "Replace"
              : "Upload"}
        </span>
        <input
          type="file"
          accept={SUPPORTED_FORMATS.join(",")}
          className="hidden"
          disabled={uploading !== null}
          onChange={(e) => {
            upload(which, e.target.files)
            e.target.value = ""
          }}
        />
      </label>
    </div>
  )

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h2">Logo &amp; cover image</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            The listing&rsquo;s logo and cover photo. Vendors set these from their
            dashboard; you can upload or replace them here.
          </Text>
        </div>
        {/* Save is disabled while an upload is still in flight. Without a
            visible reason that looks identical to a dead button — clicking it
            mid-upload reads as "nothing happened". Say which state we're in. */}
        <div className="flex items-center gap-3">
          {uploading !== null && (
            <Text className="text-ui-fg-subtle text-sm">
              Uploading {uploading === "logo" ? "logo" : "cover image"}…
            </Text>
          )}
          <Button
            variant="primary"
            size="small"
            onClick={handleSave}
            disabled={!dirty || uploading !== null}
            isLoading={update.isPending}
          >
            Save images
          </Button>
        </div>
      </div>

      {savedBanner && (
        <div className="mb-4 p-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded">
          Saved.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <Slot
          label="Logo"
          which="logo"
          value={logo}
          onClear={() => setLogo("")}
          aspect="w-32 h-32"
        />
        <Slot
          label="Cover image"
          which="cover"
          value={cover}
          onClear={() => setCover("")}
          aspect="w-full h-32"
        />
      </div>
    </Container>
  )
}
