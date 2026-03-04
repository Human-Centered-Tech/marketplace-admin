import { Container, Heading, Text, Badge, Button, Input, Textarea } from "@medusajs/ui"
import { useParams, useNavigate } from "react-router-dom"
import { useState } from "react"
import {
  useNetworkingEvent,
  useUpdateNetworkingEvent,
  useDeleteNetworkingEvent,
} from "../../../hooks/api/networking"

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
      event_date: event.event_date
        ? new Date(event.event_date).toISOString().slice(0, 16)
        : "",
      duration_minutes: event.duration_minutes || 60,
      max_participants: event.max_participants || 20,
    })
    setEditing(true)
  }

  const handleUpdate = async () => {
    await updateMutation.mutateAsync({
      id: id!,
      ...form,
      duration_minutes: Number(form.duration_minutes),
      max_participants: Number(form.max_participants),
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
              {event.event_date
                ? new Date(event.event_date).toLocaleString()
                : "No date set"}
            </Text>
          </div>
          <div className="flex gap-2">
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
              <Text className="font-medium mb-1 text-sm">Description</Text>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
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
            RSVPs
          </Heading>
          <div className="divide-y">
            {(event.rsvps as any[]).map((rsvp: any) => (
              <div
                key={rsvp.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <Text className="font-medium text-sm">
                    {rsvp.customer_id}
                  </Text>
                </div>
                <Badge color={rsvp.status === "confirmed" ? "green" : "grey"}>
                  {rsvp.status}
                </Badge>
              </div>
            ))}
          </div>
        </Container>
      )}
    </div>
  )
}
