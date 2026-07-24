import { Container, Heading, Text, Badge, Button, Input, Textarea } from "@medusajs/ui"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useState } from "react"
import {
  useNetworkingEvents,
  useCreateNetworkingEvent,
} from "../../../hooks/api/networking"
import {
  eventTimeZoneLabel,
  eventInputToISO,
  formatEventEastern,
} from "../../../lib/event-datetime"
import { HeroImageInput } from "../../gift-guides/components/hero-image-input"
import {
  EventLocationFields,
  locationTypeNeedsVenue,
  type EventLocationType,
} from "../components/event-location-fields"

const statusColors: Record<string, "green" | "orange" | "red" | "grey"> = {
  published: "green",
  draft: "orange",
  completed: "grey",
  cancelled: "red",
}

export const NetworkingEvents = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const statusFilter = searchParams.get("status") || ""
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    image_url: "",
    event_date: "",
    duration_minutes: 60,
    max_participants: 20,
    event_type: "general" as "general" | "featured",
    // Where the event happens. The column defaults to "virtual" server-side, so
    // without this control every event silently stayed virtual.
    location_type: "virtual" as EventLocationType,
    location: "",
    // Custom "Event Format" agenda -> saved into metadata.format on create.
    event_format: "",
    // Zoom join link attendees see on the event page (model column).
    zoom_join_url: "",
  })

  const { events, count, isLoading } = useNetworkingEvents(
    statusFilter ? { status: statusFilter } : undefined
  )

  const createMutation = useCreateNetworkingEvent()

  const handleCreate = async () => {
    // event_format isn't a model column — send it inside metadata.format.
    const { event_format, zoom_join_url, location, ...rest } = form
    await createMutation.mutateAsync({
      ...rest,
      // Eastern wall-clock -> real UTC instant.
      event_date: eventInputToISO(form.event_date),
      duration_minutes: Number(form.duration_minutes),
      max_participants: Number(form.max_participants),
      // Venue only means anything for in_person/hybrid; send null otherwise so a
      // virtual event never carries a stale address.
      location:
        locationTypeNeedsVenue(form.location_type) && location.trim()
          ? location.trim()
          : null,
      ...(zoom_join_url.trim() ? { zoom_join_url: zoom_join_url.trim() } : {}),
      ...(event_format.trim()
        ? { metadata: { format: event_format.trim() } }
        : {}),
    })
    setShowCreate(false)
    setForm({
      title: "",
      description: "",
      image_url: "",
      event_date: "",
      duration_minutes: 60,
      max_participants: 20,
      event_type: "general",
      location_type: "virtual",
      location: "",
      event_format: "",
      zoom_join_url: "",
    })
  }

  // A physical event with no venue line is useless to attendees (it's also what
  // the .ics invite uses as LOCATION), so require it for in_person + hybrid.
  const missingVenue =
    locationTypeNeedsVenue(form.location_type) && !form.location.trim()

  return (
    <div className="flex flex-col gap-4">
      <Container className="p-0">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <Heading level="h1">Networking Events</Heading>
            <Text className="text-ui-fg-subtle mt-1">
              {count ?? 0} events total
            </Text>
          </div>
          <div className="flex gap-2">
            <Button
              variant={!statusFilter ? "primary" : "secondary"}
              size="small"
              onClick={() => setSearchParams({})}
            >
              All
            </Button>
            {["draft", "published", "completed", "cancelled"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "primary" : "secondary"}
                size="small"
                onClick={() => setSearchParams({ status: s })}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="p-4 border-b">
          <Button
            variant="secondary"
            size="small"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "Cancel" : "Create Event"}
          </Button>
        </div>

        {showCreate && (
          <div className="p-4 border-b bg-ui-bg-subtle">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Text className="font-medium mb-1 text-sm">Title</Text>
                <Input
                  placeholder="Event title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">Event Date</Text>
                <Input
                  type="datetime-local"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
                <Text className="text-ui-fg-subtle text-xs mt-1">
                  Times are in {eventTimeZoneLabel()}
                </Text>
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">Duration (minutes)</Text>
                <Input
                  type="number"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm({ ...form, duration_minutes: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <Text className="font-medium mb-1 text-sm">Max Participants</Text>
                <Input
                  type="number"
                  value={form.max_participants}
                  onChange={(e) =>
                    setForm({ ...form, max_participants: Number(e.target.value) })
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
            <EventLocationFields
              locationType={form.location_type}
              location={form.location}
              onChange={(next) => setForm({ ...form, ...next })}
            />
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">Description</Text>
              <Textarea
                placeholder="Event description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">
                Event Format (optional)
              </Text>
              <Textarea
                rows={5}
                placeholder={
                  "Customize the agenda shown on the event page. Leave blank " +
                  "to use the standard Opening Prayer · Networking Rounds · " +
                  "Closing Reflection agenda."
                }
                value={form.event_format}
                onChange={(e) =>
                  setForm({ ...form, event_format: e.target.value })
                }
              />
            </div>
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">
                Zoom Meeting Link (optional)
              </Text>
              <Input
                type="url"
                placeholder="https://us06web.zoom.us/j/…"
                value={form.zoom_join_url}
                onChange={(e) =>
                  setForm({ ...form, zoom_join_url: e.target.value })
                }
              />
              <Text className="text-ui-fg-subtle text-xs mt-1">
                The Zoom join link attendees see on the event page. Can be added
                or changed later.
              </Text>
            </div>
            <div className="mb-4">
              <Text className="font-medium mb-1 text-sm">
                Event Graphic (optional)
              </Text>
              <HeroImageInput
                value={form.image_url}
                onChange={(url) => setForm({ ...form, image_url: url })}
              />
            </div>
            <Button
              variant="primary"
              size="small"
              onClick={handleCreate}
              isLoading={createMutation.isPending}
              disabled={!form.title || !form.event_date || missingVenue}
            >
              Create
            </Button>
            {missingVenue && (
              <Text className="text-ui-fg-subtle text-xs mt-2">
                Add a venue / address for an in-person or hybrid event.
              </Text>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="p-6 text-center text-ui-fg-subtle">Loading...</div>
        ) : !events?.length ? (
          <div className="p-6 text-center text-ui-fg-subtle">
            No events found
          </div>
        ) : (
          <div className="divide-y">
            {(events as any[]).map((event: any) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 hover:bg-ui-bg-subtle cursor-pointer"
                onClick={() => navigate(`/networking/${event.id}`)}
              >
                <div>
                  <Text className="font-medium">{event.title}</Text>
                  <Text className="text-ui-fg-subtle text-xs">
                    {formatEventEastern(event.event_date)}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Text className="text-ui-fg-subtle text-xs">
                    {event.rsvps?.filter(
                      (r: any) => r.status === "confirmed"
                    ).length ?? 0}{" "}
                    RSVPs
                  </Text>
                  {event.event_type === "featured" && (
                    <Badge color="purple">Featured</Badge>
                  )}
                  {event.location_type &&
                    event.location_type !== "virtual" && (
                      <Badge color="blue">
                        {event.location_type === "hybrid"
                          ? "Hybrid"
                          : "In Person"}
                      </Badge>
                    )}
                  <Badge color={statusColors[event.status] || "grey"}>
                    {event.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  )
}
