import { useQuery } from "@tanstack/react-query"
import {
  Container,
  Heading,
  Text,
  Badge,
  Button,
} from "@medusajs/ui"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/client"

type QueueItem = {
  id: string
  title: string
  created_at: string
  type: "directory_listing" | "barter_listing"
  tier?: string
  listing_type?: string
  owner_id?: string
}

type QueueResponse = {
  directory_listings: { count: number; items: QueueItem[] }
  barter_listings: { count: number; items: QueueItem[] }
  total: number
}

/**
 * Unified moderation inbox. Reads from /admin/moderation-queue and
 * surfaces pending directory verifications + barter moderations in
 * one place. Each item deep-links to its detail page for resolution.
 */
export const ModerationQueue = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["moderation-queue"],
    queryFn: () =>
      sdk.client
        .fetch<QueueResponse>("/admin/moderation-queue")
        .catch(() => null),
  })

  return (
    <Container className="p-0">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <Heading level="h1">Moderation Queue</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              Everything awaiting admin review in one place
            </Text>
          </div>
          {data && (
            <Badge color={data.total > 0 ? "orange" : "green"}>
              {data.total} pending
            </Badge>
          )}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="p-6 text-center text-ui-fg-subtle">Loading…</div>
      ) : (
        <>
          {/* Directory verifications */}
          <section className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Heading level="h2">Directory Verifications</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Business listings awaiting Founding Pillars review
                </Text>
              </div>
              <Badge color={data.directory_listings.count > 0 ? "orange" : "grey"}>
                {data.directory_listings.count}
              </Badge>
            </div>

            {data.directory_listings.items.length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle italic">
                All caught up.
              </Text>
            ) : (
              <div className="divide-y border rounded">
                {data.directory_listings.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <Text weight="plus">{item.title}</Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {item.tier} tier &middot; submitted{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                    <Link to={`/directory/${item.id}`}>
                      <Button variant="secondary" size="small">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Barter moderations */}
          <section className="p-6 border-b">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Heading level="h2">Barter Moderation</Heading>
                <Text size="small" className="text-ui-fg-subtle">
                  Community listings awaiting approval
                </Text>
              </div>
              <Badge color={data.barter_listings.count > 0 ? "orange" : "grey"}>
                {data.barter_listings.count}
              </Badge>
            </div>

            {data.barter_listings.items.length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle italic">
                All caught up.
              </Text>
            ) : (
              <div className="divide-y border rounded">
                {data.barter_listings.items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <Text weight="plus">{item.title}</Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {item.listing_type} &middot; by {item.owner_id?.slice(0, 8)}… &middot; submitted{" "}
                        {new Date(item.created_at).toLocaleDateString()}
                      </Text>
                    </div>
                    <Link to={`/barter/${item.id}`}>
                      <Button variant="secondary" size="small">
                        Review
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Placeholder for future moderation surfaces: flagged content,
              review replies, etc. When those modules add queues, this is
              where they surface. */}
        </>
      )}
    </Container>
  )
}
