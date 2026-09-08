import { Badge, Container, Heading, Text } from "@medusajs/ui";

/**
 * Billing health for one listing — Matteo 2026-08-18:
 *
 *   "Two new fields under directory listings to alert us when a payment failed
 *    / a subscription was canceled."
 *
 * The cancellation half already existed (`subscription_status`). The
 * payment-failure half did not: the directory Stripe webhook had handled
 * `invoice.payment_failed` since it shipped, with `attempt_count` and
 * `next_payment_attempt` in hand, and persisted none of it — so the failure
 * was invisible on the listing ten seconds after it arrived.
 *
 * The three columns behind this panel are written by that webhook and cleared
 * by every event that proves money later moved. See the backend's
 * lib/listing-payment-failure.ts for the full set-and-clear rule.
 */

const fmtDate = (v: string | Date | null | undefined) => {
  if (!v) return null;
  const d = new Date(v as any);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const fmtDateTime = (v: string | Date | null | undefined) => {
  if (!v) return null;
  const d = new Date(v as any);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString();
};

export const paymentFailedOn = (listing: any): boolean =>
  Boolean(listing?.payment_failed_at);

/**
 * Compact badge for the listings table and the page header. Exported so the
 * list view and the detail view can't disagree about what counts as failing.
 */
export const PaymentFailureBadge = ({ listing }: { listing: any }) => {
  if (!paymentFailedOn(listing)) return null;
  return (
    <Badge color="red" data-testid="payment-failed-badge">
      Payment failed
    </Badge>
  );
};

export const PaymentStatusSection = ({ listing }: { listing: any }) => {
  const failed = paymentFailedOn(listing);
  const cancelled = listing?.subscription_status === "cancelled";
  const expired = listing?.subscription_status === "expired";

  // Nothing wrong and nothing linked — don't add a panel that only ever says
  // "fine". The subscription line in the header already covers the happy path.
  if (!failed && !cancelled && !expired) return null;

  const attempts = listing?.payment_failure_count ?? null;
  const failedAt = fmtDateTime(listing?.payment_failed_at);
  const nextRetry = fmtDate(listing?.payment_next_retry_at);

  return (
    <Container className="mt-4" data-testid="payment-status-section">
      <div className="flex items-center gap-2 mb-2">
        <Heading level="h2">Billing alerts</Heading>
        <PaymentFailureBadge listing={listing} />
        {cancelled && <Badge color="orange">Subscription cancelled</Badge>}
        {expired && <Badge color="orange">Subscription expired</Badge>}
      </div>

      {failed && (
        <div className="rounded-lg border border-ui-border-error bg-ui-bg-subtle p-3 mb-2">
          <Text className="font-medium text-ui-fg-error mb-1">
            Stripe could not charge this member's card.
          </Text>
          <Text className="text-ui-fg-subtle text-sm">
            Last failure: {failedAt ?? "unknown"}
            {attempts != null && (
              <>
                {" · "}
                {attempts} attempt{attempts === 1 ? "" : "s"}
              </>
            )}
          </Text>
          <Text className="text-ui-fg-subtle text-sm">
            {nextRetry ? (
              <>Stripe will retry on {nextRetry}.</>
            ) : (
              // The end-of-dunning state: Stripe has stopped trying, so this
              // one needs a human. Worth saying explicitly rather than just
              // omitting the retry line.
              <>
                No further retry is scheduled — Stripe has finished retrying.
                This member needs to be contacted.
              </>
            )}
          </Text>
          <Text className="text-ui-fg-muted text-xs mt-2">
            This clears itself as soon as a payment succeeds. The member can fix
            their own card from their dashboard under Directory → Subscription.
          </Text>
        </div>
      )}

      {(cancelled || expired) && !failed && (
        <Text className="text-ui-fg-subtle text-sm">
          {cancelled
            ? "This membership was cancelled in Stripe. The listing is hidden from the public directory once the grace window ends."
            : "This membership lapsed. The listing reverts to the unclaimed presentation until it's renewed."}
        </Text>
      )}
    </Container>
  );
};
