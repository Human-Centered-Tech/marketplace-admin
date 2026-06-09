import { useState } from "react"
import { Container, Heading, Text, Button, Select } from "@medusajs/ui"
import {
  useDirectoryCategories,
  useUpdateDirectoryListing,
} from "../../../hooks/api/directory"

const NONE = "__none__"

/**
 * Admin editor for a directory listing's categories — a PRIMARY (required)
 * plus one optional ADDITIONAL category. Saves `category_ids` (first =
 * primary) to PUT /admin/directory/listings/:id, which writes the
 * many-to-many pivot, mirrors the primary onto category_id, and emits
 * directory-listing.updated so the change syncs to Algolia.
 */
export const CategoryEditor = ({ listing }: { listing: any }) => {
  const { categories, isLoading } = useDirectoryCategories({ limit: 200 })
  const update = useUpdateDirectoryListing()

  const initialPrimary: string = listing.category_id ?? ""
  const initialSecondary: string =
    (listing.category_links ?? []).find((l: any) => !l.is_primary)
      ?.category_id ?? ""

  const [primary, setPrimary] = useState<string>(initialPrimary)
  const [secondary, setSecondary] = useState<string>(initialSecondary)
  const [savedBanner, setSavedBanner] = useState(false)

  const options: { id: string; name: string }[] = categories ?? []
  const dirty = primary !== initialPrimary || secondary !== initialSecondary

  const handleSave = async () => {
    const categoryIds = [primary, secondary].filter(Boolean)
    await update.mutateAsync({ id: listing.id, category_ids: categoryIds })
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 2500)
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h2">Categories</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            The directory categories this listing appears under — a primary
            plus one optional additional. Changes sync to Algolia on the next
            refresh.
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={handleSave}
          isLoading={update.isPending}
          disabled={!dirty || isLoading || !primary}
        >
          Save changes
        </Button>
      </div>

      {savedBanner && (
        <div className="mb-4 p-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded">
          Saved. Algolia will refresh on next sync.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div>
          <Text size="small" weight="plus" className="mb-1">
            Primary
          </Text>
          <Select value={primary} onValueChange={setPrimary} disabled={isLoading}>
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

        <div>
          <Text size="small" weight="plus" className="mb-1">
            Additional (optional)
          </Text>
          <Select
            value={secondary || NONE}
            onValueChange={(v) => setSecondary(v === NONE ? "" : v)}
            disabled={isLoading}
          >
            <Select.Trigger>
              <Select.Value placeholder="None" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value={NONE}>None</Select.Item>
              {options
                .filter((c) => c.id !== primary)
                .map((c) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name}
                  </Select.Item>
                ))}
            </Select.Content>
          </Select>
        </div>
      </div>
    </Container>
  )
}
