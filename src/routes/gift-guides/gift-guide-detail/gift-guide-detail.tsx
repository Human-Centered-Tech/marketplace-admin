import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Container,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  Switch,
  toast,
} from "@medusajs/ui"
import {
  useGiftGuide,
  useUpdateGiftGuide,
  useDeleteGiftGuide,
  type GiftGuide,
} from "../../../hooks/api/gift-guides"
import { HeroImageInput } from "../components/hero-image-input"

function isoDateInput(value?: string | null): string {
  if (!value) return ""
  // Strip the time portion so the <input type="date"> renders correctly.
  return new Date(value).toISOString().slice(0, 10)
}

export const GiftGuideDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useGiftGuide(id!)
  const updateMutation = useUpdateGiftGuide(id!)
  const deleteMutation = useDeleteGiftGuide()

  const [form, setForm] = useState({
    slug: "",
    title: "",
    subtitle: "",
    lede: "",
    hero_image: "",
    category_handle: "",
    tags: "",
    sort_order: 0,
    featured: false,
    active_from: "",
    active_until: "",
  })

  useEffect(() => {
    const guide = (data as any)?.gift_guide as GiftGuide | undefined
    if (!guide) return
    setForm({
      slug: guide.slug ?? "",
      title: guide.title ?? "",
      subtitle: guide.subtitle ?? "",
      lede: guide.lede ?? "",
      hero_image: guide.hero_image ?? "",
      category_handle: guide.category_handle ?? "",
      tags: (guide.tags ?? []).join(", "),
      sort_order: guide.sort_order ?? 0,
      featured: !!guide.featured,
      active_from: isoDateInput(guide.active_from),
      active_until: isoDateInput(guide.active_until),
    })
  }, [data])

  const handleSave = async () => {
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    try {
      await updateMutation.mutateAsync({
        slug: form.slug,
        title: form.title,
        subtitle: form.subtitle || null,
        lede: form.lede || null,
        hero_image: form.hero_image || null,
        category_handle: form.category_handle || null,
        tags: tags.length ? tags : null,
        sort_order: Number(form.sort_order) || 0,
        featured: form.featured,
        active_from: form.active_from || null,
        active_until: form.active_until || null,
      })
      toast.success("Gift guide saved")
    } catch (e: any) {
      toast.error(e?.message || "Save failed")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this gift guide? This cannot be undone.")) return
    try {
      await deleteMutation.mutateAsync(id!)
      toast.success("Gift guide deleted")
      navigate("/gift-guides")
    } catch (e: any) {
      toast.error(e?.message || "Delete failed")
    }
  }

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Loading…</Text>
      </Container>
    )
  }

  if (!(data as any)?.gift_guide) {
    return (
      <Container className="p-6">
        <Text className="text-ui-fg-subtle">Gift guide not found.</Text>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-0">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <Heading level="h1">{form.title || "Edit Gift Guide"}</Heading>
            <Text className="text-ui-fg-subtle mt-1">/{form.slug}</Text>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => navigate("/gift-guides")}
            >
              Back
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={handleDelete}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
            <Button
              variant="primary"
              size="small"
              onClick={handleSave}
              isLoading={updateMutation.isPending}
              disabled={!form.slug || !form.title}
            >
              Save
            </Button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Text className="font-medium mb-1 text-sm">Slug *</Text>
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Title *</Text>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Subtitle</Text>
              <Input
                value={form.subtitle}
                onChange={(e) =>
                  setForm({ ...form, subtitle: e.target.value })
                }
              />
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Hero Image</Text>
              <HeroImageInput
                value={form.hero_image}
                onChange={(url) => setForm({ ...form, hero_image: url })}
              />
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">
                Tags (comma-separated)
              </Text>
              <Input
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
              />
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Products with any of these tag values appear in the guide.
              </Text>
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Category handle</Text>
              <Input
                value={form.category_handle}
                onChange={(e) =>
                  setForm({ ...form, category_handle: e.target.value })
                }
              />
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Sort order</Text>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) =>
                  setForm({ ...form, sort_order: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-end gap-3">
              <div>
                <Text className="font-medium mb-1 text-sm">Featured</Text>
                <Switch
                  checked={form.featured}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, featured: checked })
                  }
                />
              </div>
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Active from</Text>
              <Input
                type="date"
                value={form.active_from}
                onChange={(e) =>
                  setForm({ ...form, active_from: e.target.value })
                }
              />
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Active until</Text>
              <Input
                type="date"
                value={form.active_until}
                onChange={(e) =>
                  setForm({ ...form, active_until: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <Text className="font-medium mb-1 text-sm">Lede</Text>
            <Textarea
              value={form.lede}
              onChange={(e) => setForm({ ...form, lede: e.target.value })}
            />
          </div>
        </div>
      </Container>
    </div>
  )
}
