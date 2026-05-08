import { Container, Heading, Switch, Text, toast } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import {
  useProductFeaturedState,
  useUpsertProductFeatured,
} from "../../../../../hooks/api/featured-products"

type Props = {
  product: HttpTypes.AdminProduct
}

// "Feature on homepage" toggle — only present in the platform admin (this
// app). Vendors don't see this UI and can't call the underlying API
// (/admin/featured-products/* is admin-auth-gated).
//
// Mirrors the gift-guide Featured switch: a single boolean column on a
// dedicated table (`featured_product`), no tag mechanism. The storefront
// carousel queries that table and joins to live product data, so any
// future thumbnail/title edits on the product flow through automatically.
export const ProductFeaturedHomepageSection = ({ product }: Props) => {
  const { data } = useProductFeaturedState(product.id)
  const upsert = useUpsertProductFeatured(product.id)

  const isFeatured = !!(data as any)?.featured_product?.featured

  const handleToggle = async (next: boolean) => {
    try {
      await upsert.mutateAsync({ featured: next })
      toast.success(
        next ? "Added to homepage carousel" : "Removed from homepage carousel"
      )
    } catch (e: any) {
      toast.error(e?.message || "Failed to update")
    }
  }

  return (
    <Container className="flex flex-col gap-y-4 px-6 py-4">
      <div className="flex items-center justify-between">
        <Heading level="h2">Homepage</Heading>
      </div>
      <div>
        <Text className="font-medium mb-1 text-sm">Featured</Text>
        <Switch
          checked={isFeatured}
          disabled={upsert.isPending}
          onCheckedChange={handleToggle}
        />
      </div>
    </Container>
  )
}
