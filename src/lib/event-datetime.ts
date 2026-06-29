// Networking events are scheduled and displayed in US Eastern — the storefront
// pins event display to America/New_York ("Events are scheduled in US Eastern").
// These helpers keep the admin form on the same convention: interpret the
// datetime-local value as Eastern wall-clock, store a real UTC instant, and
// convert back for editing — so the time the admin types is exactly what
// attendees see on the storefront. Previously the naive string was sent as-is
// and parsed in the server's zone (UTC on Railway), silently shifting events
// with no indication of which zone was meant.

export const EVENT_TIME_ZONE = "America/New_York"

// Offset (minutes, east-positive) of EVENT_TIME_ZONE at a given UTC instant.
const easternOffsetMinutes = (instant: number): number => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant))
  const m: Record<string, number> = {}
  for (const p of parts) if (p.type !== "literal") m[p.type] = Number(p.value)
  const hour = m.hour === 24 ? 0 : m.hour
  // Treat the Eastern wall-clock as if it were UTC, then diff against the instant.
  const asUTC = Date.UTC(m.year, m.month - 1, m.day, hour, m.minute, m.second)
  return Math.round((asUTC - instant) / 60000)
}

// "YYYY-MM-DDTHH:mm" (Eastern wall-clock) -> UTC ISO instant.
export const eventInputToISO = (value: string): string => {
  if (!value) return ""
  const [datePart, timePart] = value.split("T")
  if (!datePart || !timePart) return ""
  const [y, mo, d] = datePart.split("-").map(Number)
  const [h, mi] = timePart.split(":").map(Number)
  if ([y, mo, d, h, mi].some((n) => Number.isNaN(n))) return ""
  // First guess treats the wall-clock as UTC, then corrects by the Eastern
  // offset at that approximate instant (exact except within the DST overlap hour).
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  const off = easternOffsetMinutes(guess)
  return new Date(guess - off * 60000).toISOString()
}

// UTC instant -> "YYYY-MM-DDTHH:mm" in Eastern, for a datetime-local input.
export const isoToEventInput = (
  value: string | number | Date | null | undefined
): string => {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: EVENT_TIME_ZONE,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(d)
  const m: Record<string, string> = {}
  for (const p of parts) if (p.type !== "literal") m[p.type] = p.value
  const hour = m.hour === "24" ? "00" : m.hour
  return `${m.year}-${m.month}-${m.day}T${hour}:${m.minute}`
}

// e.g. "Eastern Time (EDT)" — the zone the inputs/displays use.
export const eventTimeZoneLabel = (): string => {
  try {
    const abbr = new Date()
      .toLocaleTimeString("en-US", {
        timeZone: EVENT_TIME_ZONE,
        timeZoneName: "short",
      })
      .split(" ")
      .pop()
    return abbr && /[A-Za-z]/.test(abbr) ? `Eastern Time (${abbr})` : "Eastern Time"
  } catch {
    return "Eastern Time"
  }
}

// UTC instant -> human display string in Eastern (for admin lists/headers).
export const formatEventEastern = (
  value: string | number | Date | null | undefined
): string => {
  if (!value) return "No date set"
  const d = new Date(value)
  if (isNaN(d.getTime())) return "No date set"
  // NOTE: do NOT use dateStyle/timeStyle here — combining either with
  // timeZoneName throws a RangeError in Intl.DateTimeFormat. Use explicit
  // field options instead. e.g. "Jul 27, 2026, 7:00 PM EDT".
  return d.toLocaleString("en-US", {
    timeZone: EVENT_TIME_ZONE,
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  })
}
