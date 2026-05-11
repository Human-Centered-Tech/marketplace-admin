import { Container, Heading, Text, Badge, Button, Input, Textarea, Switch } from "@medusajs/ui"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useState } from "react"
import {
  useGiftGuides,
  useCreateGiftGuide,
  type GiftGuide,
} from "../../../hooks/api/gift-guides"
import { HeroImageInput } from "../components/hero-image-input"

const blankForm = {
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
}

export const GiftGuideList = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const featuredFilter = searchParams.get("featured") || ""
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(blankForm)

  const query: Record<string, string> = {}
  if (featuredFilter) query.featured = featuredFilter

  const { gift_guides, count, isLoading } = useGiftGuides(
    Object.keys(query).length ? query : undefined
  )

  const createMutation = useCreateGiftGuide()

  const handleCreate = async () => {
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    await createMutation.mutateAsync({
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
    setShowCreate(false)
    setForm(blankForm)
  }

  const setFilter = (value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set("featured", value)
    else params.delete("featured")
    setSearchParams(params)
  }

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-0">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <Heading level="h1">Gift Guides</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              {count ?? 0} guides total
            </Text>
          </div>
          <div className="flex gap-2">
            <Button
              variant={!featuredFilter ? "primary" : "secondary"}
              size="small"
              onClick={() => setFilter("")}
            >
              All
            </Button>
            <Button
              variant={featuredFilter === "true" ? "primary" : "secondary"}
              size="small"
              onClick={() => setFilter("true")}
            >
              Featured
            </Button>
          </div>
        </div>

        <div className="p-4 border-b">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancel" : "Create Guide"}
          </Button>
        </div>

        {showCreate && (
          <div className="p-4 border-b bg-ui-bg-subtle">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Text className="font-medium mb-1 text-sm">Slug *</Text>
                <Input
                  placeholder="easter, sacraments, …"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">Title *</Text>
                <Input
                  placeholder="Easter Gifts"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">Subtitle</Text>
                <Input
                  placeholder="Celebrate the Resurrection"
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
                  placeholder="easter, resurrection, paschal"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">Category handle</Text>
                <Input
                  placeholder="(optional)"
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
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">Lede</Text>
              <Textarea
                placeholder="One- or two-sentence intro shown on the hub and detail pages."
                value={form.lede}
                onChange={(e) => setForm({ ...form, lede: e.target.value })}
              />
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!form.slug || !form.title}
            >
              Create
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
        ) : !gift_guides?.length ? (
          <div className="p-6 text-center text-ui-fg-subtle">
            No gift guides yet
          </div>
        ) : (
          <div className="divide-y">
            {(gift_guides as GiftGuide[]).map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                onClick={() => navigate(`/gift-guides/${g.id}`)}
              >
                <div>
                  <Text className="font-medium">{g.title}</Text>
                  <Text className="text-ui-fg-subtle text-xs">
                    /{g.slug}
                    {g.subtitle ? ` · ${g.subtitle}` : ""}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Text className="text-ui-fg-subtle text-xs">
                    sort {g.sort_order}
                  </Text>
                  {g.featured && <Badge color="green">Featured</Badge>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
