import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "react-router-dom"
import { sdk } from "../../../lib/client"

type Reason = "no_price" | "store_offline" | "no_channel" | "no_seller"

type Row = {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  seller_id: string | null
  seller_name: string | null
  seller_handle: string | null
  store_status: string | null
  reason: Reason
}

type Response = {
  products: Row[]
  count: number
  published_total: number
  by_reason: Partial<Record<Reason, number>>
}

/**
 * Catalog health — published products that shoppers still cannot see.
 *
 * A seller's dashboard says "Published", so they assume the product is live.
 * Several conditions silently hide it anyway, with no warning to them and no
 * existing place for us to notice. This is that place: the answer to "why
 * isn't my product showing up?" without anyone reading a database.
 */
const REASONS: Record<
  Reason,
  { label: string; help: string; fix: string; color: "orange" | "red" | "grey" }
> = {
  no_price: {
    label: "No price",
    help: "No variant has a price",
    fix: "The seller needs to set a price on at least one variant.",
    color: "red",
  },
  store_offline: {
    label: "Store not live",
    help: "The seller's store is not ACTIVE",
    fix: "The seller hasn't gone live yet (or is suspended). Their whole catalogue is hidden.",
    color: "orange",
  },
  no_channel: {
    label: "No sales channel",
    help: "Not linked to any sales channel",
    fix: "Link the product to a sales channel.",
    color: "grey",
  },
  no_seller: {
    label: "No seller",
    help: "Not linked to any seller",
    fix: "Data problem — the product has no owning store.",
    color: "grey",
  },
}

export const CatalogHealthList = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const reasonFilter = (searchParams.get("reason") || "") as Reason | ""

  const { data, isLoading } = useQuery({
    queryKey: ["catalog-health"],
    queryFn: () =>
      sdk.client.fetch<Response>("/admin/catalog-health", { method: "GET" }),
  })

  const all = data?.products ?? []
  const rows = reasonFilter ? all.filter((r) => r.reason === reasonFilter) : all

  const setReason = (r: Reason | "") =>
    setSearchParams(r ? { reason: r } : {})

  return (
    <Container className="p-0 divide-y">
      <div className="p-6">
        <Heading level="h1">Catalog health</Heading>
        <Text size="small" className="text-ui-fg-subtle mt-1">
          {isLoading
            ? "Checking…"
            : `${data?.count ?? 0} of ${
                data?.published_total ?? 0
              } published products can't be seen by shoppers. Sellers see these as "Published", so they won't know.`}
        </Text>

        <div className="flex flex-wrap gap-2 mt-4">
          <FilterChip
            label={`All (${all.length})`}
            active={!reasonFilter}
            onClick={() => setReason("")}
          />
          {(Object.keys(REASONS) as Reason[])
            .filter((r) => (data?.by_reason?.[r] ?? 0) > 0)
            .map((r) => (
              <FilterChip
                key={r}
                label={`${REASONS[r].label} (${data?.by_reason?.[r] ?? 0})`}
                active={reasonFilter === r}
                onClick={() => setReason(r)}
              />
            ))}
        </div>
      </div>

      {!isLoading && rows.length === 0 && (
        <div className="p-6">
          <Text className="text-ui-fg-subtle">
            Nothing hidden — every published product is visible to shoppers.
          </Text>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b bg-ui-bg-subtle">
              <tr>
                <Th>Product</Th>
                <Th>Seller</Th>
                <Th>Why it's hidden</Th>
                <Th>What fixes it</Th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ui-bg-subtle">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      {r.thumbnail ? (
                        <img
                          src={r.thumbnail}
                          alt=""
                          className="w-8 h-8 rounded object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded bg-ui-bg-base border shrink-0" />
                      )}
                      <a
                        href={`/app/products/${r.id}`}
                        className="text-ui-fg-interactive hover:underline"
                      >
                        {r.title}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {r.seller_id ? (
                      <a
                        href={`/app/sellers/${r.seller_id}`}
                        className="text-ui-fg-interactive hover:underline"
                      >
                        {r.seller_name}
                      </a>
                    ) : (
                      <Text size="small" className="text-ui-fg-muted">
                        —
                      </Text>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <Badge color={REASONS[r.reason].color}>
                      {REASONS[r.reason].label}
                    </Badge>
                    <Text size="small" className="text-ui-fg-subtle mt-1">
                      {REASONS[r.reason].help}
                    </Text>
                  </td>
                  <td className="px-6 py-3">
                    <Text size="small" className="text-ui-fg-subtle">
                      {REASONS[r.reason].fix}
                    </Text>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  )
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-6 py-3">
    <Text size="small" weight="plus" className="text-ui-fg-subtle">
      {children}
    </Text>
  </th>
)

const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1 rounded-full border text-sm transition-colors ${
      active
        ? "bg-ui-bg-base-pressed border-ui-border-strong"
        : "hover:bg-ui-bg-subtle"
    }`}
  >
    {label}
  </button>
)
