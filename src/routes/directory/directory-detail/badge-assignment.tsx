import { Container, Heading, Text, Button, Select } from "@medusajs/ui"
import { useState } from "react"
import {
  useDirectoryBadges,
  useListingBadges,
  useAssignListingBadge,
  useRemoveListingBadge,
} from "../../../hooks/api/directory"

export const BadgeAssignment = ({ listingId }: { listingId: string }) => {
  const { badges: allBadges, isLoading: loadingAll } = useDirectoryBadges()
  const { badges: assignedBadges, isLoading: loadingAssigned } =
    useListingBadges(listingId)
  const assign = useAssignListingBadge()
  const remove = useRemoveListingBadge()

  const [selected, setSelected] = useState("")

  const assignedIds = new Set((assignedBadges || []).map((b: any) => b.id))
  const availableBadges = (allBadges || []).filter(
    (b: any) => !assignedIds.has(b.id)
  )

  const handleAssign = async () => {
    if (!selected) return
    await assign.mutateAsync({ listingId, badgeId: selected })
    setSelected("")
  }

  const handleRemove = async (badgeId: string) => {
    await remove.mutateAsync({ listingId, badgeId })
  }

  if (loadingAll || loadingAssigned) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">
          Loading badges...
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <Heading level="h2" className="mb-4">
        Custom Badges
      </Heading>
      <Text className="text-ui-fg-subtle mb-4">
        Assign custom badges to this listing (e.g., partnership badges). Manage
        the badge library at{" "}
        <a href="/directory/badges" className="underline">
          Directory &rsaquo; Badges
        </a>
        .
      </Text>

      {/* Assigned badges */}
      {assignedBadges && assignedBadges.length > 0 ? (
        <div className="flex flex-wrap gap-2 mb-6">
          {(assignedBadges as any[]).map((badge: any) => (
            <div
              key={badge.id}
              className="flex items-center gap-2 pl-3 pr-1 py-1 rounded-full text-[11px] font-bold uppercase"
              style={{
                backgroundColor: badge.color || "#F2CD69",
                color: "#17294A",
              }}
            >
              {badge.name}
              <button
                onClick={() => handleRemove(badge.id)}
                className="w-5 h-5 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center"
                title="Remove badge"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Text className="text-ui-fg-subtle mb-6 italic">
          No badges assigned.
        </Text>
      )}

      {/* Assignment control */}
      {availableBadges.length > 0 ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Select value={selected} onValueChange={setSelected}>
              <Select.Trigger>
                <Select.Value placeholder="Choose a badge to assign..." />
              </Select.Trigger>
              <Select.Content>
                {availableBadges.map((badge: any) => (
                  <Select.Item key={badge.id} value={badge.id}>
                    {badge.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <Button
            variant="primary"
            size="small"
            onClick={handleAssign}
            disabled={!selected}
            isLoading={assign.isPending}
          >
            Assign
          </Button>
        </div>
      ) : (
        <Text className="text-ui-fg-subtle italic">
          {allBadges?.length
            ? "All available badges are already assigned."
            : "No badges defined yet. Create some at Directory › Badges."}
        </Text>
      )}
    </Container>
  )
}
