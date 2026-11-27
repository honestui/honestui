"use client"

import { ScheduleBuilder } from "@/registry/default/product/schedule-builder/schedule-builder"

/** Counted from 6 March 2026, two days before New York moves its clocks forward. */
const BEFORE_THE_CHANGE = new Date("2026-03-06T12:00:00Z")

/**
 * A nightly job at 2:30 in New York. On 8 March 2026 the clocks jump from
 * 2:00 to 3:00, so that run happens at 3:30 and is marked. Switch the zone to
 * UTC to see the same expression without the gap.
 */
export default function ScheduleBuilderDaylight() {
  return (
    <div className="flex w-full max-w-xl min-w-0 flex-col">
      <ScheduleBuilder
        defaultValue="30 2 * * *"
        defaultTimeZone="America/New_York"
        now={BEFORE_THE_CHANGE}
        aria-label="Nightly cleanup schedule"
      />
    </div>
  )
}
