import { Container, Heading, Text, Badge, Button, Input, Textarea } from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  useNetworkingEvent,
  useUpdateNetworkingEvent,
  useDeleteNetworkingEvent,
} from "../../../hooks/api/networking"
import {
  eventTimeZoneLabel,
  isoToEventInput,
  eventInputToISO,
  formatEventEastern,
} from "../../../lib/event-datetime"
import { HeroImageInput } from "../../gift-guides/components/hero-image-input"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  published: "green",
  draft: "orange",
  completed: "grey",
  cancelled: "red",
}

export const NetworkingEventDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading } = useNetworkingEvent(id!)
  const updateMutation = useUpdateNetworkingEvent()
  const deleteMutation = useDeleteNetworkingEvent()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<Record<string, any>>({})

  const event = (data as any)?.event

  if (isLoading) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
      </Container>
    )
  }

  if (!event) {
    return (
      <Container>
        <div className="p-6 text-center text-ui-fg-subtle">
          Event not found
        </div>
      </Container>
    )
  }

  const startEdit = () => {
    setForm({
      title: event.title || "",
      description: event.description || "",
      image_url: event.image_url || "",
      // Stored UTC instant -> Eastern datetime-local string (matches what was typed).
      event_date: isoToEventInput(event.event_date),
      duration_minutes: event.duration_minutes || 60,
      max_participants: event.max_participants || 20,
      event_type: event.event_type || "general",
      // Custom "Event Format" agenda. Stored in metadata.format (no dedicated
      // column); empty = storefront shows the standard agenda.
      event_format: event.metadata?.format || "",
    })
    setEditing(true)
  }

  const handleUpdate = async () => {
    // event_format isn't a model column — fold it into the metadata JSON
    // (merging existing keys) instead of sending it as a top-level field.
    const { event_format, ...rest } = form
    await updateMutation.mutateAsync({
      id: id!,
      ...rest,
      // Eastern wall-clock -> real UTC instant.
      event_date: eventInputToISO(form.event_date),
      duration_minutes: Number(form.duration_minutes),
      max_participants: Number(form.max_participants),
      metadata: {
        ...(event.metadata || {}),
        format:
          typeof event_format === "string" && event_format.trim()
            ? event_format.trim()
            : undefined,
      },
    })
    setEditing(false)
  }

  const handleStatusChange = async (status: string) => {
    await updateMutation.mutateAsync({ id: id!, status })
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id!)
    navigate("/networking")
  }

  return (
    <div className="flex flex-col gap-4">
      <Container>
        <div className="flex items-start justify-between mb-4">
          <div>
            <Heading level="h1">{event.title}</Heading>
            <Text className="text-ui-fg-subtle">
              {formatEventEastern(event.event_date)}
            </Text>
          </div>
          <div className="flex gap-2">
            {event.event_type === "featured" && (
              <Badge color="purple">Featured</Badge>
            )}
            <Badge color={statusColors[event.status] || "grey"}>
              {event.status}
            </Badge>
          </div>
        </div>

        {!editing ? (
          <>
            {event.description && (
              <div className="mb-4">
                <Text className="font-medium mb-1">Description</Text>
                <Text className="text-ui-fg-subtle">{event.description}</Text>
              </div>
            )}

            {event.metadata?.format && (
              <div className="mb-4">
                <Text className="font-medium mb-1">Event Format</Text>
                <Text className="text-ui-fg-subtle whitespace-pre-line">
                  {event.metadata.format}
                </Text>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Text className="font-medium mb-1">Duration</Text>
                <Text className="text-ui-fg-subtle text-sm">
                  {event.duration_minutes} minutes
                </Text>
              </div>
              <div>
                <Text className="font-medium mb-1">Max Participants</Text>
                <Text className="text-ui-fg-subtle text-sm">
                  {event.max_participants}
                </Text>
              </div>
              <div>
                <Text className="font-medium mb-1">RSVP Count</Text>
                <Text className="text-ui-fg-subtle text-sm">
                  {event.rsvp_count ?? 0}
                </Text>
              </div>
              <div>
                <Text className="font-medium mb-1">Created</Text>
                <Text className="text-ui-fg-subtle text-sm">
                  {event.created_at
                    ? new Date(event.created_at).toLocaleString()
                    : "—"}
                </Text>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" size="small" onClick={startEdit}>
                Edit
              </Button>
              {event.status === "draft" && (
                <Button
                  variant="primary"
                  size="small"
                  onClick={() => handleStatusChange("published")}
                  isLoading={updateMutation.isPending}
                >
                  Publish
                </Button>
              )}
              {event.status === "published" && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => handleStatusChange("cancelled")}
                  isLoading={updateMutation.isPending}
                >
                  Cancel Event
                </Button>
              )}
              <Button
                variant="danger"
                size="small"
                onClick={handleDelete}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </div>
          </>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Text className="font-medium mb-1 text-sm">Title</Text>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">Event Date</Text>
                <Input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) =>
                    setForm({ ...form, event_date: e.target.value })
                  }
                />
                <Text className="text-ui-fg-subtle text-xs mt-1">
                  Times are in {eventTimeZoneLabel()}
                </Text>
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">
                  Duration (minutes)
                </Text>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      duration_minutes: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">
                  Max Participants
                </Text>
                <Input
                  type="number"
                  value={form.max_participants}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      max_participants: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>
            <div className="mb-4">
              <Text className="font-medium mb-2 text-sm">Event Type</Text>
              <div className="flex flex-col gap-2">
                {(
                  [
                    {
                      value: "general",
                      label: "General",
                      hint: "Open to all logged-in customers",
                    },
                    {
                      value: "featured",
                      label: "Featured",
                      hint: "Restricted to Featured + Enterprise tier vendors",
                    },
                  ] as const
                ).map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-start gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="event_type"
                      value={opt.value}
                      checked={form.event_type === opt.value}
                      onChange={() =>
                        setForm({ ...form, event_type: opt.value })
                      }
                      className="mt-1"
                    />
                    <div>
                      <Text className="font-medium text-sm">{opt.label}</Text>
                      <Text className="text-ui-fg-subtle text-xs">
                        {opt.hint}
                      </Text>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">Description</Text>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">
                Event Format (optional)
              </Text>
              <Textarea
                rows={5}
                placeholder={
                  "Customize the agenda shown on the event page, e.g.\n" +
                  "Opening Prayer — a brief reflection on the dignity of labor.\n" +
                  "Networking Rounds — structured 1-on-1 breakout sessions.\n" +
                  "Closing Reflection — shared insights and prayer intentions."
                }
                value={form.event_format}
                onChange={(e) =>
                  setForm({ ...form, event_format: e.target.value })
                }
              />
              <Text className="text-ui-fg-subtle text-xs mt-1">
                Overrides the standard agenda for this event. Leave blank to use
                the default (Opening Prayer · Networking Rounds · Closing
                Reflection).
              </Text>
            </div>
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">
                Event Graphic (optional)
              </Text>
              <HeroImageInput
                value={form.image_url || ""}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="small"
                onClick={handleUpdate}
                isLoading={updateMutation.isPending}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                size="small"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Container>

      {/* RSVP List */}
      {event.rsvps && event.rsvps.length > 0 && (
        <Container>
          <Heading level="h2" className="mb-4">
            RSVPs ({event.rsvps.length})
          </Heading>
          <div className="divide-y">
            {(event.rsvps as any[]).map((rsvp: any) => {
              const c = rsvp.customer
              const fullName =
                c && (c.first_name || c.last_name)
                  ? [c.first_name, c.last_name].filter(Boolean).join(" ")
                  : null
              const primaryLabel = fullName || c?.email || rsvp.customer_id
              const secondaryLabel =
                fullName && c?.email ? c.email : null
              const tierColor: Record<string, "purple" | "green" | "grey"> = {
                enterprise: "purple",
                featured: "purple",
                verified: "green",
              }
              const planLabel = c?.networking_plan
                ? c.networking_status === "gifted"
                  ? "Gifted"
                  : c.networking_plan === "annual"
                    ? "Annual"
                    : "Monthly"
                : null
              return (
                <div
                  key={rsvp.id}
                  className="flex items-center justify-between py-2 gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <Text className="font-medium text-sm truncate">
                      {primaryLabel}
                    </Text>
                    {c?.business_name && (
                      <Text className="text-ui-fg-subtle text-xs truncate">
                        {c.business_name}
                        {c.location ? ` · ${c.location}` : ""}
                      </Text>
                    )}
                    {!c?.business_name && c?.location && (
                      <Text className="text-ui-fg-subtle text-xs truncate">
                        {c.location}
                      </Text>
                    )}
                    {secondaryLabel && (
                      <Text className="text-ui-fg-subtle text-xs truncate">
                        {secondaryLabel}
                      </Text>
                    )}
                    {c && !c.has_account && (
                      <Text className="text-ui-fg-subtle text-xs italic">
                        Guest (no account)
                      </Text>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {planLabel && (
                      <Badge
                        color={
                          c?.networking_status === "gifted" ? "orange" : "blue"
                        }
                      >
                        {planLabel}
                      </Badge>
                    )}
                    {c?.directory_tier && (
                      <Badge color={tierColor[c.directory_tier] || "grey"}>
                        {c.directory_tier}
                      </Badge>
                    )}
                    <Badge color={rsvp.status === "confirmed" ? "green" : "grey"}>
                      {rsvp.status}
                    </Badge>
                    {rsvp.created_at && (
                      <Text className="text-ui-fg-subtle text-xs whitespace-nowrap">
                        RSVP'd {new Date(rsvp.created_at).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Container>
      )}
    </div>
  )
}
