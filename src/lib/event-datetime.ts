// A <input type="datetime-local"> works in the browser's LOCAL timezone, but the
// networking_event.event_date column is `timestamptz`. Previously the naive
// string (e.g. "2026-07-15T19:00") was sent as-is and parsed server-side in the
// server's zone (UTC on Railway) — so whatever the admin typed was stored as that
// wall-clock in UTC and then rendered back via toLocaleString() in each viewer's
// zone, silently shifting the time with no indication of which zone was meant.
//
// These helpers make the input behave as the admin's local time: convert local ->
// a real UTC instant on save, and the stored instant -> a local input string on
// edit. Displays (toLocaleString) then show the correct local time for every
// viewer. Pair the inputs with localTimeZoneLabel() so the zone is explicit.

export const localTimeZoneLabel = (): string => {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const abbr = new Date()
      .toLocaleTimeString("en-US", { timeZoneName: "short" })
      .split(" ")
      .pop()
    return abbr && /[A-Za-z]/.test(abbr) ? `${zone} (${abbr})` : zone
  } catch {
    return "your local timezone"
  }
}

// Stored instant -> "YYYY-MM-DDTHH:mm" in LOCAL time, for a datetime-local input.
export const toLocalDatetimeInput = (
  value: string | number | Date | null | undefined
): string => {
  if (!value) return ""
  const d = new Date(value)
  if (isNaN(d.getTime())) return ""
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

// datetime-local value (local wall-clock) -> UTC ISO instant for the API.
export const localDatetimeInputToISO = (value: string): string => {
  if (!value) return ""
  const d = new Date(value) // naive datetime-local string is parsed as local time
  return isNaN(d.getTime()) ? "" : d.toISOString()
}
