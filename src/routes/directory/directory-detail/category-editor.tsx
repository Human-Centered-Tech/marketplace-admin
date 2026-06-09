import { useState } from "react"
import { Container, Heading, Text, Button, Select } from "@medusajs/ui"
import {
  useDirectoryCategories,
  useUpdateDirectoryListing,
} from "../../../hooks/api/directory"

/**
 * Admin editor for a directory listing's category — assigns one of the
 * directory categories (managed at /directory/categories) to this listing.
 *
 * The backend PUT /admin/directory/listings/:id accepts category_id and
 * emits directory-listing.updated, so the change propagates to Algolia on
 * the next sync.
 */
export const CategoryEditor = ({ listing }: { listing: any }) => {
  const { categories, isLoading } = useDirectoryCategories({ limit: 200 })
  const update = useUpdateDirectoryListing()

  const [selected, setSelected] = useState<string>(listing.category_id ?? "")
  const [savedBanner, setSavedBanner] = useState(false)

  const options: { id: string; name: string }[] = categories ?? []
  const dirty = selected !== (listing.category_id ?? "")

  const handleSave = async () => {
    await update.mutateAsync({
      id: listing.id,
      category_id: selected || null,
    })
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 2500)
  }

  const currentName =
    options.find((c) => c.id === (listing.category_id ?? ""))?.name ??
    listing.category?.name ??
    "—"

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h2">Category</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            The directory category this listing appears under. Current:{" "}
            <span className="font-medium text-ui-fg-base">{currentName}</span>.
            Changes sync to Algolia on the next refresh.
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={handleSave}
          isLoading={update.isPending}
          disabled={!dirty || isLoading}
        >
          Save changes
        </Button>
      </div>

      {savedBanner && (
        <div className="mb-4 p-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded">
          Saved. Algolia will refresh on next sync.
        </div>
      )}

      <div className="max-w-md">
        <Select
          value={selected}
          onValueChange={setSelected}
          disabled={isLoading}
        >
          <Select.Trigger>
            <Select.Value placeholder="Select a category…" />
          </Select.Trigger>
          <Select.Content>
            {options.map((c) => (
              <Select.Item key={c.id} value={c.id}>
                {c.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>
    </Container>
  )
}
