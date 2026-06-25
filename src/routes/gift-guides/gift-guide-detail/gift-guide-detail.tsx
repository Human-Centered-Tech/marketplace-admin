import { useEffect, useMemo, useState } from "react"
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
import { useCreateProductTag } from "../../../hooks/api/tags"
import { Combobox } from "../../../components/inputs/combobox"
import { useComboboxData } from "../../../hooks/use-combobox-data"
import { sdk } from "../../../lib/client"
import { HeroImageInput } from "../components/hero-image-input"
import { GiftGuideProductsSection } from "./components/gift-guide-products-section"

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
    short_name: "",
    guide_number: "",
    subtitle: "",
    lede: "",
    hero_image: "",
    category_handle: "",
    status: "published" as "draft" | "published" | "archived",
    tags: [] as string[],
    sort_order: 0,
    featured: false,
    active_from: "",
    active_until: "",
  })

  const tagOptions = useComboboxData({
    queryKey: ["product_tags"],
    queryFn: (params) => sdk.admin.productTag.list(params),
    getOptions: (data) =>
      data.product_tags.map((tag) => ({
        label: tag.value,
        // Guide stores tag *values* (strings), not IDs — keep the combobox
        // value in that same shape so the form maps 1:1 to guide.tags.
        value: tag.value,
      })),
  })

  // Ensure currently-selected tag values stay visible as chips even if
  // they haven't shown up in tagOptions yet (paginated fetch) or don't
  // have a product_tag row at all (legacy/stale data).
  const tagComboOptions = useMemo(() => {
    const seen = new Set(tagOptions.options.map((o) => o.value))
    const extras = form.tags
      .filter((v) => !seen.has(v))
      .map((v) => ({ label: v, value: v }))
    return [...tagOptions.options, ...extras]
  }, [tagOptions.options, form.tags])

  const createTag = useCreateProductTag()

  useEffect(() => {
    const guide = (data as any)?.gift_guide as GiftGuide | undefined
    if (!guide) return
    setForm({
      slug: guide.slug ?? "",
      title: guide.title ?? "",
      short_name: guide.short_name ?? "",
      guide_number: guide.guide_number ?? "",
      subtitle: guide.subtitle ?? "",
      lede: guide.lede ?? "",
      hero_image: guide.hero_image ?? "",
      category_handle: guide.category_handle ?? "",
      status: guide.status ?? "published",
      // Hide the slug "anchor" tag from the editable list (it's always kept on
      // save, so editing the rest can't orphan the guide's products).
      tags: (guide.tags ?? []).filter((t) => t !== guide.slug),
      sort_order: guide.sort_order ?? 0,
      featured: !!guide.featured,
      active_from: isoDateInput(guide.active_from),
      active_until: isoDateInput(guide.active_until),
    })
  }, [data])

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        slug: form.slug,
        title: form.title,
        short_name: form.short_name || null,
        guide_number: form.guide_number || null,
        subtitle: form.subtitle || null,
        lede: form.lede || null,
        hero_image: form.hero_image || null,
        category_handle: form.category_handle || null,
        status: form.status,
        // Always persist the slug as a tag — the stable "membership" anchor
        // that this guide's products are tagged with. Without it, editing the
        // tag list would orphan the guide's products. Extra tags are additive.
        tags: Array.from(new Set([form.slug, ...form.tags].filter(Boolean))),
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
              <Text className="font-medium mb-1 text-sm">Status</Text>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as
                      | "draft"
                      | "published"
                      | "archived",
                  })
                }
                className="bg-ui-bg-field border-ui-border-base text-ui-fg-base h-8 w-full rounded-md border px-2 text-sm"
              >
                <option value="published">Published (live)</option>
                <option value="draft">Draft (hidden)</option>
                <option value="archived">Archived (hidden)</option>
              </select>
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Only Published guides appear on the storefront.
              </Text>
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Short name</Text>
              <Input
                value={form.short_name}
                placeholder="Postpartum Guide"
                onChange={(e) =>
                  setForm({ ...form, short_name: e.target.value })
                }
              />
            </div>
            <div>
              <Text className="font-medium mb-1 text-sm">Guide number</Text>
              <Input
                value={form.guide_number}
                placeholder="No. 001"
                onChange={(e) =>
                  setForm({ ...form, guide_number: e.target.value })
                }
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
              <Text className="font-medium mb-1 text-sm">Tags</Text>
              <Combobox
                multiple
                value={form.tags}
                onChange={(v) =>
                  setForm({ ...form, tags: (v as string[]) ?? [] })
                }
                options={tagComboOptions}
                searchValue={tagOptions.searchValue}
                onSearchValueChange={tagOptions.onSearchValueChange}
                fetchNextPage={tagOptions.fetchNextPage}
                onCreateOption={async (value) => {
                  // Combobox bug: clicking the "clear all" chip X fires
                  // this with an empty array, not a typed string. Bail.
                  if (typeof value !== "string" || !value.trim()) return
                  try {
                    await createTag.mutateAsync({ value })
                    setForm((f) => ({ ...f, tags: [...f.tags, value] }))
                    tagOptions.onSearchValueChange?.("")
                  } catch (e: any) {
                    toast.error(e?.message || "Failed to create tag")
                  }
                }}
              />
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Products you add below stay anchored to this guide automatically.
                These optional tags add MORE products (any product carrying a tag
                appears) — editing them won&apos;t remove products you&apos;ve added.
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

      <GiftGuideProductsSection guideId={id!} />
    </div>
  )
}
