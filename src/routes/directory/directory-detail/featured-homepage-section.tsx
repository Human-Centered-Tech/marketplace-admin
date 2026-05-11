import { Container, Heading, Switch, Text, toast } from "@medusajs/ui"
import {
  useListingFeaturedState,
  useUpsertListingFeatured,
} from "../../../hooks/api/featured-listings"

// "Feature on homepage" toggle for directory listings — mirrors the
// product-side toggle. The storefront's Featured Services carousel pulls
// from this table and joins to live listing data.
export const FeaturedHomepageSection = ({ listingId }: { listingId: string }) => {
  const { data } = useListingFeaturedState(listingId)
  const upsert = useUpsertListingFeatured(listingId)

  const isFeatured = !!(data as any)?.featured_listing?.featured

  const handleToggle = async (next: boolean) => {
    try {
      await upsert.mutateAsync({ featured: next })
      toast.success(
        next
          ? "Added to Featured Services carousel"
          : "Removed from Featured Services carousel"
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
        <Text className="font-medium mb-1 text-sm">Featured Service</Text>
        <Switch
          checked={isFeatured}
          disabled={upsert.isPending}
          onCheckedChange={handleToggle}
        />
      </div>
    </Container>
  )
}
