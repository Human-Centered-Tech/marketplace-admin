import { useEffect, useRef, useState } from "react"
import { Container, Heading, Text, Button, Input, Badge, toast } from "@medusajs/ui"
import { XMark } from "@medusajs/icons"
import {
  useListingAffiliations,
  useAddListingAffiliation,
  useRemoveListingAffiliation,
  useDirectoryParishes,
} from "../../../hooks/api/directory"

/**
 * Admin editor for a directory listing's parish affiliations (Brooke 7/6).
 * A debounced typeahead against /admin/directory/parishes + chips for the
 * current affiliations, backed by /admin/directory/listings/:id/affiliations.
 * The backend enforces the same tier-based cap as the storefront, so raising
 * the tier (tier override above) is the way to unlock more slots.
 */
export const ParishAffiliations = ({ listing }: { listing: any }) => {
  const listingId = listing.id
  const { affiliations, limit, remaining, isLoading } =
    useListingAffiliations(listingId)
  const add = useAddListingAffiliation(listingId)
  const remove = useRemoveListingAffiliation(listingId)

  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebounced(query.trim()), 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const { parishes } = useDirectoryParishes(
    debounced.length >= 2 ? { q: debounced, limit: 8 } : undefined
  )

  const affiliatedParishIds = new Set(
    (affiliations ?? []).map((a: any) => a.parish_id)
  )
  // Only surface results for an actual search (>=2 chars) so a short/empty
  // query never dumps an arbitrary first-page of parishes into the dropdown.
  const results =
    debounced.length >= 2
      ? (parishes ?? []).filter((p: any) => !affiliatedParishIds.has(p.id))
      : []
  const atCap = typeof remaining === "number" ? remaining <= 0 : false

  const handleAdd = async (parishId: string) => {
    try {
      await add.mutateAsync(parishId)
      setQuery("")
      setDebounced("")
    } catch (e: any) {
      toast.error(e?.message || "Could not add parish")
    }
  }

  const handleRemove = async (affiliationId: string) => {
    try {
      await remove.mutateAsync(affiliationId)
    } catch (e: any) {
      toast.error(e?.message || "Could not remove parish")
    }
  }

  return (
    <Container>
      <div className="mb-4">
        <Heading level="h2">Parish affiliations</Heading>
        <Text className="text-ui-fg-subtle text-sm">
          The parishes this listing is affiliated with.{" "}
          {typeof limit === "number" && (
            <>
              {(affiliations?.length ?? 0)} of {limit} used
              {atCap
                ? " — raise the tier above to add more."
                : "."}
            </>
          )}
        </Text>
      </div>

      {affiliations && affiliations.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-4">
          {affiliations.map((a: any) => (
            <Badge
              key={a.id}
              size="small"
              className="flex items-center gap-1 pr-1"
            >
              <span>
                {a.parish?.name ?? a.parish_id}
                {a.parish?.city ? (
                  <span className="text-ui-fg-subtle">{` · ${a.parish.city}`}</span>
                ) : null}
              </span>
              <button
                type="button"
                aria-label={`Remove ${a.parish?.name ?? "parish"}`}
                onClick={() => handleRemove(a.id)}
                disabled={remove.isPending}
                className="ml-1 rounded hover:bg-ui-bg-base-hover p-0.5"
              >
                <XMark className="text-ui-fg-muted" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <Text className="text-ui-fg-muted text-sm mb-4">
          No parish affiliations yet.
        </Text>
      )}

      {!atCap && (
        <div className="max-w-xl relative">
          <Input
            placeholder="Search parishes by name, city, or state…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border bg-ui-bg-base shadow-elevation-flyout overflow-hidden">
              {results.map((p: any) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAdd(p.id)}
                  disabled={add.isPending}
                  className="w-full text-left px-3 py-2 hover:bg-ui-bg-base-hover disabled:opacity-50"
                >
                  <Text size="small" weight="plus">
                    {p.name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {[[p.city, p.state].filter(Boolean).join(", "), p.diocese]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  )
}
