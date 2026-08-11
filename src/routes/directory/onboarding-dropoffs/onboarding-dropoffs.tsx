import { Badge, Button, Container, Heading, Input, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { sdk } from "../../../lib/client"
import { useOnboardingDropoffs } from "../../../hooks/api/directory"

const PAGE_SIZE = 50

/**
 * "Onboarding Drop-offs" (punchlist c721, 8/11): sellers who created a vendor
 * account but never finished go-live (store still INACTIVE, no activation
 * payment). The "With products" filter is the priority cohort — they uploaded
 * a catalog and may think they're already done. Export gives Brooke a
 * send-ready CSV for the migration email push.
 */
export const OnboardingDropoffs = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const qParam = searchParams.get("q") || ""
  const withProducts = searchParams.get("with_products") === "true"
  const showInternal = searchParams.get("include_internal") === "true"
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)
  const [exporting, setExporting] = useState(false)

  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      updateParams({ q: searchInput.trim(), offset: 0 })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const updateParams = (
    changes: Partial<{
      q: string
      with_products: boolean
      include_internal: boolean
      offset: number
    }>
  ) => {
    const next = {
      q: changes.q !== undefined ? changes.q : qParam,
      with_products:
        changes.with_products !== undefined ? changes.with_products : withProducts,
      include_internal:
        changes.include_internal !== undefined
          ? changes.include_internal
          : showInternal,
      offset: changes.offset !== undefined ? changes.offset : offset,
    }
    const params: Record<string, string> = {}
    if (next.q) params.q = next.q
    if (next.with_products) params.with_products = "true"
    if (next.include_internal) params.include_internal = "true"
    if (next.offset > 0) params.offset = String(next.offset)
    setSearchParams(params)
  }

  const query: Record<string, string | number> = { offset, limit: PAGE_SIZE }
  if (qParam) query.q = qParam
  if (withProducts) query.with_products = "true"
  if (showInternal) query.include_internal = "true"
  const { sellers, count, internalCount, isLoading } = useOnboardingDropoffs(query)

  const total = count ?? 0
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

  // Full filtered list (not just the current page), quoted for commas.
  const handleExport = async () => {
    setExporting(true)
    try {
      const exportQuery: Record<string, string | number> = { limit: 500 }
      if (qParam) exportQuery.q = qParam
      if (withProducts) exportQuery.with_products = "true"
      if (showInternal) exportQuery.include_internal = "true"
      const data = await sdk.client.fetch<{ sellers: any[] }>(
        "/admin/directory/onboarding-dropoffs",
        { method: "GET", query: exportQuery }
      )
      const rows = data.sellers || []
      const esc = (v: unknown) => {
        const s = v == null ? "" : String(v)
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
      }
      const csv = [
        ["Business", "Email", "Signed up", "Products", "Grandfathered", "Subscribed"].join(","),
        ...rows.map((s: any) =>
          [
            esc(s.name),
            esc(s.email),
            esc(new Date(s.created_at).toISOString().slice(0, 10)),
            esc(s.product_count),
            esc(s.grandfathered ? "yes" : ""),
            esc(s.listing_subscribed ? "yes" : ""),
          ].join(",")
        ),
      ].join("\n")
      const url = URL.createObjectURL(
        new Blob([csv], { type: "text/csv;charset=utf-8" })
      )
      const a = document.createElement("a")
      a.href = url
      a.download = `onboarding-dropoffs-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success(`Exported ${rows.length} sellers.`)
    } catch (e: any) {
      toast.error(e?.message || "Export failed.")
    } finally {
      setExporting(false)
    }
  }

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h1">Onboarding Drop-offs</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Sellers who created an account but never finished going live.
              &ldquo;With products&rdquo; = they uploaded a catalog and may
              think they&rsquo;re already done.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="search"
              placeholder="Search email or business…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-72"
            />
            <Button
              variant="secondary"
              size="small"
              onClick={handleExport}
              isLoading={exporting}
            >
              Export CSV
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={!withProducts ? "primary" : "secondary"}
              size="small"
              onClick={() => updateParams({ with_products: false, offset: 0 })}
            >
              All
            </Button>
            <Button
              variant={withProducts ? "primary" : "secondary"}
              size="small"
              onClick={() => updateParams({ with_products: true, offset: 0 })}
            >
              With products
            </Button>
          </div>
          {internalCount > 0 && (
            <Text className="text-ui-fg-subtle text-xs">
              {showInternal
                ? `Including ${internalCount} team/test accounts`
                : `${internalCount} team/test accounts hidden`}{" "}
              <button
                className="underline"
                type="button"
                onClick={() =>
                  updateParams({ include_internal: !showInternal, offset: 0 })
                }
              >
                {showInternal ? "Hide" : "Show"}
              </button>
            </Text>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !sellers?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No onboarding drop-offs — everyone finished. 🎉
        </div>
      ) : (
        <>
          <div className="divide-y">
            {(sellers as any[]).map((seller: any) => (
              <div
                key={seller.id}
                className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                onClick={() => navigate(`/sellers/${seller.id}`)}
              >
                <div>
                  <Text className="font-medium">{seller.name || seller.id}</Text>
                  <Text className="text-ui-fg-subtle text-xs">
                    {seller.email} · signed up{" "}
                    {new Date(seller.created_at).toLocaleDateString()}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  {seller.internal && <Badge color="grey">Team/test</Badge>}
                  {seller.grandfathered && (
                    <Badge color="blue">Grandfathered</Badge>
                  )}
                  {seller.listing_subscribed && (
                    <Badge color="green">Has subscription</Badge>
                  )}
                  {seller.product_count > 0 && (
                    <Badge color="orange">
                      {seller.product_count}{" "}
                      {seller.product_count === 1 ? "product" : "products"}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between p-4 border-t">
            <Text className="text-ui-fg-subtle text-sm">
              Page {Math.floor(offset / PAGE_SIZE) + 1} of{" "}
              {Math.max(1, Math.ceil(total / PAGE_SIZE))} · {total} total
            </Text>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="small"
                disabled={!canPrev}
                onClick={() =>
                  updateParams({ offset: Math.max(0, offset - PAGE_SIZE) })
                }
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={!canNext}
                onClick={() => updateParams({ offset: offset + PAGE_SIZE })}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </Container>
  )
}
