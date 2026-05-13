import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Container, Heading, Text, Button, IconButton, toast } from "@medusajs/ui"
import { Trash, Plus } from "@medusajs/icons"
import { Combobox } from "../../../../components/inputs/combobox"
import { useComboboxData } from "../../../../hooks/use-combobox-data"
import { sdk } from "../../../../lib/client"
import {
  useGiftGuideProducts,
  useAddGiftGuideProduct,
  useRemoveGiftGuideProduct,
} from "../../../../hooks/api/gift-guides"

type Props = {
  guideId: string
}

export const GiftGuideProductsSection = ({ guideId }: Props) => {
  const { data, isLoading } = useGiftGuideProducts(guideId)
  const addMutation = useAddGiftGuideProduct(guideId)
  const removeMutation = useRemoveGiftGuideProduct(guideId)
  const [pendingProductId, setPendingProductId] = useState<string>("")

  const products = data?.products ?? []
  const guideTags = data?.guide_tags ?? []

  // Exclude products already in the guide from the picker.
  const inGuideIds = useMemo(
    () => new Set(products.map((p) => p.id)),
    [products]
  )

  const productPicker = useComboboxData({
    queryKey: ["admin_products_for_gift_guide"],
    queryFn: (params) => sdk.admin.product.list(params),
    getOptions: (response) =>
      response.products
        .filter((p) => !inGuideIds.has(p.id))
        .map((p) => ({ label: p.title, value: p.id })),
  })

  const handleAdd = async () => {
    if (!pendingProductId) return
    try {
      await addMutation.mutateAsync(pendingProductId)
      toast.success("Product added to guide")
      setPendingProductId("")
    } catch (e: any) {
      toast.error(e?.message || "Failed to add product")
    }
  }

  const handleRemove = async (productId: string, title: string) => {
    if (!confirm(`Remove "${title}" from this guide?`)) return
    try {
      await removeMutation.mutateAsync(productId)
      toast.success("Product removed from guide")
    } catch (e: any) {
      toast.error(e?.message || "Failed to remove product")
    }
  }

  return (
    <Container className="p-0">
      <div className="p-6 border-b">
        <Heading level="h2">Products</Heading>
        <Text className="text-ui-fg-subtle mt-1 text-sm">
          {guideTags.length === 0 ? (
            "Add tags to this guide above before linking products."
          ) : (
            <>
              Adding a product applies these tags:{" "}
              <span className="font-mono text-ui-fg-base">
                {guideTags.join(", ")}
              </span>
              . Removing strips those same tags from the product, which also
              drops it from any other guide that shares them.
            </>
          )}
        </Text>
      </div>

      {guideTags.length > 0 && (
        <div className="p-6 border-b flex items-end gap-2">
          <div className="flex-1">
            <Text className="font-medium mb-1 text-sm">Add a product</Text>
            <Combobox
              value={pendingProductId}
              onChange={(v) => setPendingProductId((v as string) ?? "")}
              options={productPicker.options}
              searchValue={productPicker.searchValue}
              onSearchValueChange={productPicker.onSearchValueChange}
              fetchNextPage={productPicker.fetchNextPage}
            />
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={handleAdd}
            disabled={!pendingProductId || addMutation.isPending}
            isLoading={addMutation.isPending}
          >
            <Plus />
            Add
          </Button>
        </div>
      )}

      <div className="p-6">
        {isLoading ? (
          <Text className="text-ui-fg-subtle">Loading…</Text>
        ) : products.length === 0 ? (
          <Text className="text-ui-fg-subtle">
            No products in this guide yet.
          </Text>
        ) : (
          <div className="flex flex-col gap-2">
            <Text className="text-ui-fg-subtle text-xs uppercase tracking-wider mb-1">
              {products.length} product{products.length === 1 ? "" : "s"}
            </Text>
            {products.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between border rounded-md px-3 py-2 hover:bg-ui-bg-subtle"
              >
                <Link
                  to={`/products/${p.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1 group"
                >
                  {p.thumbnail ? (
                    <img
                      src={p.thumbnail}
                      alt=""
                      className="w-8 h-8 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-ui-bg-base-pressed shrink-0" />
                  )}
                  <div className="min-w-0">
                    <Text className="font-medium truncate group-hover:text-ui-fg-interactive">
                      {p.title}
                    </Text>
                    {p.handle && (
                      <Text className="text-ui-fg-subtle text-xs truncate">
                        /{p.handle}
                      </Text>
                    )}
                  </div>
                </Link>
                <IconButton
                  variant="transparent"
                  size="small"
                  onClick={() => handleRemove(p.id, p.title)}
                  disabled={removeMutation.isPending}
                  aria-label={`Remove ${p.title} from guide`}
                >
                  <Trash />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}
