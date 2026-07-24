import { Input, Text } from "@medusajs/ui"

// Location controls for the networking event create + edit forms.
//
// The `location_type` column (virtual | in_person | hybrid) and the `location`
// venue line landed on the backend with validation, but neither admin form had
// a control for them — so every event silently stayed "virtual" no matter what
// it actually was. Shared between the two forms so they can't drift apart.

export type EventLocationType = "virtual" | "in_person" | "hybrid"

export const EVENT_LOCATION_TYPES: {
  value: EventLocationType
  label: string
  hint: string
}[] = [
  {
    value: "virtual",
    label: "Virtual",
    hint: "Online only — attendees join via the Zoom link.",
  },
  {
    value: "in_person",
    label: "In Person",
    hint: "Physical venue only — no Zoom link is shown.",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    hint: "Both — attendees can join at the venue or on Zoom.",
  },
]

// in_person + hybrid are the only types where a venue line means anything.
export const locationTypeNeedsVenue = (type: string | undefined) =>
  type === "in_person" || type === "hybrid"

type Props = {
  locationType: EventLocationType
  location: string
  onChange: (next: { location_type: EventLocationType; location: string }) => void
}

export const EventLocationFields = ({
  locationType,
  location,
  onChange,
}: Props) => {
  const showVenue = locationTypeNeedsVenue(locationType)

  return (
    <>
      <div className="mb-4">
        <Text className="font-medium mb-2 text-sm">Location</Text>
        <div className="flex flex-col gap-2">
          {EVENT_LOCATION_TYPES.map((opt) => (
            <label
              key={opt.value}
              className="flex items-start gap-2 cursor-pointer"
            >
              <input
                type="radio"
                name="location_type"
                value={opt.value}
                checked={locationType === opt.value}
                onChange={() =>
                  onChange({
                    location_type: opt.value,
                    // Switching back to virtual drops the venue line — a
                    // virtual event with a stale address renders badly on the
                    // storefront and in the .ics invite.
                    location: opt.value === "virtual" ? "" : location,
                  })
                }
                className="mt-1"
              />
              <div>
                <Text className="font-medium text-sm">{opt.label}</Text>
                <Text className="text-ui-fg-subtle text-xs">{opt.hint}</Text>
              </div>
            </label>
          ))}
        </div>
      </div>

      {showVenue && (
        <div className="mb-4">
          <Text className="font-medium mb-1 text-sm">Venue / Address</Text>
          <Input
            placeholder="St. Mary's Parish Hall, 123 Main St, Springfield, IL"
            value={location}
            onChange={(e) =>
              onChange({ location_type: locationType, location: e.target.value })
            }
          />
          <Text className="text-ui-fg-subtle text-xs mt-1">
            Shown on the event page and used as the location in the calendar
            invite attendees receive.
          </Text>
        </div>
      )}
    </>
  )
}
