import { Container, Heading, Text, Badge, Button, Input, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useClaimIntents, useVoidClaimIntent } from "../../../hooks/api/directory"

const PAGE_SIZE = 50

const statusColors: Record<string, "orange" | "green" | "grey"> = {
  attested: "orange",
  completed: "green",
  voided: "grey",
}

/**
 * "Claim Attempts" (claim-flow rebuild 7/7): every claim is recorded from the
 * attestation on, so Brooke can see in-progress and stalled claims instead of
 * them silently vanishing (the Suzi/Hixon failure). Attested = awaiting
 * payment; Completed = ownership transferred; admin can VOID a fraudulent or
 * abandoned attempt to free the listing for another claimant.
 */
export const DirectoryClaims = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") || ""
  const qParam = searchParams.get("q") || ""
  const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0)
  const voidMutation = useVoidClaimIntent()
  const prompt = usePrompt()

  const [searchInput, setSearchInput] = useState(qParam)
  useEffect(() => {
    setSearchInput(qParam)
  }, [qParam])
  useEffect(() => {
    if (searchInput === qParam) return
    const t = setTimeout(() => {
      const params: Record<string, string> = {}
      if (statusFilter) params.status = statusFilter
      if (searchInput.trim()) params.q = searchInput.trim()
      setSearchParams(params)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  const query: Record<string, string | number> = { offset, limit: PAGE_SIZE }
  if (statusFilter) query.status = statusFilter
  if (qParam) query.q = qParam
  const { intents, count, isLoading } = useClaimIntents(query)

  const total = count ?? 0
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total
  const setPage = (nextOffset: number) => {
    const params: Record<string, string> = {}
    if (statusFilter) params.status = statusFilter
    if (qParam) params.q = qParam
    if (nextOffset > 0) params.offset = String(nextOffset)
    setSearchParams(params)
  }
  const setStatus = (next: string) => {
    const params: Record<string, string> = {}
    if (next) params.status = next
    if (qParam) params.q = qParam
    setSearchParams(params)
  }

  const handleVoid = async (intent: any) => {
    const confirmed = await prompt({
      title: "Void this claim attempt?",
      description: `${intent.email} will no longer have a claim in progress on "${intent.business_name}". The listing becomes claimable by others. The attempt stays on record.`,
      confirmText: "Void claim",
      cancelText: "Cancel",
    })
    if (!confirmed) return
    try {
      await voidMutation.mutateAsync(intent.id)
      toast.success("Claim attempt voided.")
    } catch (e: any) {
      toast.error(e?.message || "Could not void the claim.")
    }
  }

  return (
    <Container className="p-0">
      <div className="flex flex-col gap-4 p-6 border-b">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Heading level="h1">Claim Attempts</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Every listing claim from attestation on — attested means awaiting
              payment; completed means ownership transferred.
            </Text>
          </div>
          <Input
            type="search"
            placeholder="Search email or business…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-72"
          />
        </div>
        <div className="flex gap-2">
          {["", "attested", "completed", "voided"].map((s) => (
            <Button
              key={s || "all"}
              variant={statusFilter === s ? "primary" : "secondary"}
              size="small"
              onClick={() => setStatus(s)}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : "All"}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      ) : !intents?.length ? (
        <div className="p-6 text-center text-ui-fg-subtle">
          No claim attempts found
        </div>
      ) : (
        <>
          <div className="divide-y">
            {(intents as any[]).map((intent: any) => (
              <div
                key={intent.id}
                className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                onClick={() => navigate(`/directory/${intent.listing_id}`)}
              >
                <div>
                  <Text className="font-medium">
                    {intent.business_name || intent.listing_id}
                  </Text>
                  <Text className="text-ui-fg-subtle text-xs">
                    {intent.email} ·{" "}
                    {new Date(intent.created_at).toLocaleString()}
                  </Text>
                </div>
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {intent.grandfathered && (
                    <Badge color="blue">Grandfathered</Badge>
                  )}
                  <Badge color={statusColors[intent.status] || "grey"}>
                    {intent.status}
                  </Badge>
                  {intent.status === "attested" && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => handleVoid(intent)}
                      isLoading={voidMutation.isPending}
                    >
                      Void
                    </Button>
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
                onClick={() => setPage(Math.max(0, offset - PAGE_SIZE))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="small"
                disabled={!canNext}
                onClick={() => setPage(offset + PAGE_SIZE)}
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
