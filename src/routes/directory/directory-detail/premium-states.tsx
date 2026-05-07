import { useState } from "react"
import { Container, Heading, Text, Button } from "@medusajs/ui"
import { useUpdateDirectoryListing } from "../../../hooks/api/directory"

// 50 US state codes (no DC/territories — Bubble's source data is 50-only).
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "IA", "ID", "IL", "IN", "KS", "KY", "LA", "MA", "MD",
  "ME", "MI", "MN", "MO", "MS", "MT", "NC", "ND", "NE", "NH",
  "NJ", "NM", "NV", "NY", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VA", "VT", "WA", "WI", "WV", "WY",
]

const parseStates = (raw: string | null | undefined): string[] =>
  (raw ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => s.length === 2)

export const PremiumStatesEditor = ({ listing }: { listing: any }) => {
  const update = useUpdateDirectoryListing()
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(parseStates(listing.address?.premium_states))
  )
  const [savedBanner, setSavedBanner] = useState(false)

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  const handleSave = async () => {
    const sorted = US_STATES.filter((s) => selected.has(s))
    await update.mutateAsync({
      id: listing.id,
      address: {
        ...(listing.address ?? {}),
        premium_states: sorted.length ? sorted.join(", ") : null,
      },
    })
    setSavedBanner(true)
    setTimeout(() => setSavedBanner(false), 2500)
  }

  return (
    <Container>
      <div className="flex items-center justify-between mb-4">
        <div>
          <Heading level="h2">Premium States</Heading>
          <Text className="text-ui-fg-subtle text-sm">
            States where this listing gets premium banner placement on
            /us/directory. Only enterprise-tier listings render banners.
            Click to toggle. {selected.size} of 50 selected.
          </Text>
        </div>
        <Button
          variant="primary"
          size="small"
          onClick={handleSave}
          isLoading={update.isPending}
        >
          Save changes
        </Button>
      </div>

      {savedBanner && (
        <div className="mb-4 p-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded">
          Saved. Algolia will refresh on next sync.
        </div>
      )}

      <div className="grid grid-cols-10 gap-2">
        {US_STATES.map((code) => {
          const on = selected.has(code)
          return (
            <button
              key={code}
              type="button"
              onClick={() => toggle(code)}
              className={`px-2 py-1 text-xs font-mono rounded border transition-colors ${
                on
                  ? "bg-ui-bg-interactive text-ui-fg-on-color border-ui-border-interactive"
                  : "bg-ui-bg-base text-ui-fg-base border-ui-border-base hover:bg-ui-bg-base-hover"
              }`}
            >
              {code}
            </button>
          )
        })}
      </div>
    </Container>
  )
}
