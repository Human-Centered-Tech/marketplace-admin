import { StatusCell } from "@components/table/table-cells/common/status-cell";

// Friendly labels/colors for the backend's computed `account_status`.
const ACCOUNT_STATUS_CONFIG: Record<
  string,
  { label: string; color: "green" | "orange" | "grey" | "red" }
> = {
  active: { label: "Live", color: "green" },
  on_vacation: { label: "On vacation", color: "orange" },
  draft: { label: "Draft", color: "grey" },
  suspended: { label: "Suspended", color: "red" },
};

export const SellerStatusBadge = ({
  status,
  accountStatus,
}: {
  status: string;
  accountStatus?: string | null;
}) => {
  // Prefer the friendly account_status badge when the backend provides it;
  // otherwise fall back to rendering the raw store_status.
  if (accountStatus && ACCOUNT_STATUS_CONFIG[accountStatus]) {
    const { label, color } = ACCOUNT_STATUS_CONFIG[accountStatus];
    return <StatusCell color={color}>{label}</StatusCell>;
  }

  switch (status) {
    case "INACTIVE":
      return <StatusCell color="orange">{status}</StatusCell>;
    case "ACTIVE":
      return <StatusCell color="green">{status}</StatusCell>;
    case "SUSPENDED":
      return <StatusCell color="red">{status}</StatusCell>;
    default:
      return <StatusCell color="grey">{status}</StatusCell>;
  }
};
