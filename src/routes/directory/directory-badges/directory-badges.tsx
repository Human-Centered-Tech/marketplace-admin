import { useState } from "react"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Label,
  Textarea,
} from "@medusajs/ui"
import {
  useDirectoryBadges,
  useCreateDirectoryBadge,
  useUpdateDirectoryBadge,
  useDeleteDirectoryBadge,
} from "../../../hooks/api/directory"

type BadgeForm = {
  name: string
  slug: string
  description: string
  icon_url: string
  color: string
  sort_order: number
}

const emptyForm: BadgeForm = {
  name: "",
  slug: "",
  description: "",
  icon_url: "",
  color: "#F2CD69",
  sort_order: 0,
}

export const DirectoryBadges = () => {
  const { badges, isLoading } = useDirectoryBadges()
  const createBadge = useCreateDirectoryBadge()
  const updateBadge = useUpdateDirectoryBadge()
  const deleteBadge = useDeleteDirectoryBadge()

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<BadgeForm>(emptyForm)

  const handleSubmit = async () => {
    const payload = {
      ...form,
      description: form.description || null,
      icon_url: form.icon_url || null,
    }
    if (editingId) {
      await updateBadge.mutateAsync({ id: editingId, ...payload })
    } else {
      await createBadge.mutateAsync(payload)
    }
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  const handleEdit = (badge: any) => {
    setEditingId(badge.id)
    setForm({
      name: badge.name || "",
      slug: badge.slug || "",
      description: badge.description || "",
      icon_url: badge.icon_url || "",
      color: badge.color || "#F2CD69",
      sort_order: badge.sort_order ?? 0,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        "Delete this badge? It will be removed from any listings currently using it."
      )
    ) {
      await deleteBadge.mutateAsync(id)
    }
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setShowForm(false)
    setEditingId(null)
  }

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between p-6 border-b">
        <div>
          <Heading level="h1">Directory Badges</Heading>
          <Text className="text-ui-fg-subtle mt-1">
            {badges?.length ?? 0} badges total. Assign these to listings from
            the listing detail view.
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={() => {
            setEditingId(null)
            setForm(emptyForm)
            setShowForm(true)
          }}
        >
          Add Badge
        </Button>
      </div>

      {showForm && (
        <div className="p-6 border-b bg-ui-bg-subtle">
          <Heading level="h2" className="mb-4">
            {editingId ? "Edit Badge" : "Add Badge"}
          </Heading>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="badge-name">Name</Label>
              <Input
                id="badge-name"
                placeholder="e.g. His Way at Work Partner"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="badge-slug">Slug (auto if blank)</Label>
              <Input
                id="badge-slug"
                placeholder="his-way-at-work-partner"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label htmlFor="badge-desc">Description</Label>
              <Textarea
                id="badge-desc"
                placeholder="Shown as tooltip on the badge"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="badge-icon">Icon URL (optional)</Label>
              <Input
                id="badge-icon"
                placeholder="https://..."
                value={form.icon_url}
                onChange={(e) => setForm({ ...form, icon_url: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="badge-color">Color</Label>
              <div className="flex gap-2 items-center">
                <Input
                  id="badge-color"
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm({ ...form, color: e.target.value })
                  }
                  className="w-16 p-1"
                />
                <Input
                  value={form.color}
                  onChange={(e) =>
                    setForm({ ...form, color: e.target.value })
                  }
                  placeholder="#F2CD69"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="badge-order">Sort Order</Label>
              <Input
                id="badge-order"
                type="number"
                value={String(form.sort_order)}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sort_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="small"
              onClick={handleSubmit}
              isLoading={createBadge.isPending || updateBadge.isPending}
              disabled={!form.name}
            >
              {editingId ? "Update" : "Create"}
            </Button>
            <Button variant="secondary" size="small" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !badges?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No badges yet. Click &ldquo;Add Badge&rdquo; to create one.
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[60px_1fr_1fr_80px_120px] gap-4 px-4 py-2 border-b bg-ui-bg-subtle">
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Preview
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Name
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Slug
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Order
            </Text>
            <Text size="small" weight="plus" className="text-ui-fg-subtle">
              Actions
            </Text>
          </div>
          <div className="divide-y">
            {(badges as any[]).map((badge: any) => (
              <div
                key={badge.id}
                className="grid grid-cols-[60px_1fr_1fr_80px_120px] gap-4 px-4 py-3 items-center hover:bg-ui-bg-subtle"
              >
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block text-center"
                  style={{
                    backgroundColor: badge.color || "#F2CD69",
                    color: "#17294A",
                  }}
                >
                  {badge.name?.slice(0, 6) || "—"}
                </span>
                <Text className="font-medium">{badge.name}</Text>
                <Text className="text-ui-fg-subtle">{badge.slug}</Text>
                <Text className="text-ui-fg-subtle">{badge.sort_order}</Text>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleEdit(badge)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    onClick={() => handleDelete(badge.id)}
                    isLoading={deleteBadge.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Container>
  )
}
