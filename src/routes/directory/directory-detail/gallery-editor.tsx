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

const MAX_PHOTOS = 8

// `//host/...` protocol-relative URLs (some legacy CDN paths) need a scheme
// to render inside the admin <img>.
const normalize = (u?: string | null) =>
  u && u.startsWith("//") ? `https:${u}` : u || ""

/**
 * Admin editor for the merchant photo gallery (directory_listing.gallery_urls —
 * up to 8 image URLs, a JSON string[]). Vendors upload these from the storefront;
 * admins had no way to add/replace them. Uploads go through the platform file
 * store via /admin/uploads (sdk.admin.upload.create), the same endpoint the gift
 * guide / event graphic pickers use, and the URLs save back through the existing
 * PUT /admin/directory/listings/:id (which passes the body straight to
 * updateDirectoryListings).
 */
export const GalleryEditor = ({ listing }: { listing: any }) => {
  const update = useUpdateDirectoryListing()

  const initial: string[] = Array.isArray(listing.gallery_urls)
    ? (listing.gallery_urls as string[])
    : []
  const [urls, setUrls] = useState<string[]>(initial)
  const [uploading, setUploading] = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)

  const atMax = urls.length >= MAX_PHOTOS
  const dirty = JSON.stringify(urls) !== JSON.stringify(initial)

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || !fileList.length) return
    const remaining = MAX_PHOTOS - urls.length
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_PHOTOS} photos.`)
      return
    }
    const toUpload = Array.from(fileList).slice(0, remaining)
    const bad = toUpload.find((f) => !SUPPORTED_FORMATS.includes(f.type))
    if (bad) {
      toast.error(`Unsupported format: ${bad.type || bad.name}`)
      return
    }
    setUploading(true)
    try {
      const { files } = await sdk.admin.upload.create({ files: toUpload })
      const added = (files ?? [])
        .map((f: any) => f?.url)
        .filter((u: string | undefined): u is string => !!u)
      if (!added.length) throw new Error("Upload returned no URL")
      setUrls((prev) => [...prev, ...added].slice(0, MAX_PHOTOS))
      if (fileList.length > remaining) {
        toast.warning(
          `Only ${MAX_PHOTOS} photos allowed — extra files were skipped.`
        )
      }
    } catch (e: any) {
      toast.error(e?.message || "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const removeAt = (i: number) =>
    setUrls((prev) => prev.filter((_, idx) => idx !== i))

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        id: listing.id,
        // Persist an explicit empty array (not null) so clearing the gallery
        // sticks; the store read routes treat both as "no photos".
        gallery_urls: urls,
      })
      setSavedBanner(true)
      setTimeout(() => setSavedBanner(false), 2500)
    } catch (e: any) {
      toast.error(e?.message || "Could not save photos.")
    }
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h2">Photo Gallery</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            Up to {MAX_PHOTOS} photos — shown as a gallery on the public listing.
            The vendor can also manage these from their own dashboard.
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={handleSave}
          disabled={!dirty}
          isLoading={update.isPending}
        >
          Save photos
        </Button>
      </div>

      {savedBanner && (
        <div className="mb-4 p-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded">
          Saved.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {urls.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative w-24 h-24 shrink-0 rounded border overflow-hidden bg-ui-bg-subtle"
          >
            <img
              src={normalize(url)}
              alt={`Photo ${i + 1}`}
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-sm leading-none flex items-center justify-center hover:bg-black/80"
            >
              ×
            </button>
          </div>
        ))}

        {!atMax && (
          <label className="w-24 h-24 shrink-0 rounded border border-dashed border-ui-border-strong hover:border-ui-border-interactive flex flex-col items-center justify-center gap-1 cursor-pointer transition">
            <Text className="text-ui-fg-subtle text-xs text-center px-1">
              {uploading ? "Uploading…" : "Add photo"}
            </Text>
            <input
              type="file"
              accept={SUPPORTED_FORMATS.join(",")}
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ""
              }}
            />
          </label>
        )}
      </div>

      <Text className="text-ui-fg-subtle text-xs mt-2">
        {urls.length}/{MAX_PHOTOS} photos
      </Text>
    </Container>
  )
}
