import { useMemo, useState } from "react";

import { PencilSquare, User } from "@medusajs/icons";
import {
  Badge,
  Button,
  Container,
  Drawer,
  Heading,
  Input,
  Label,
  Text,
  toast,
  usePrompt,
} from "@medusajs/ui";

import { createColumnHelper } from "@tanstack/react-table";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { VendorSeller } from "@custom-types/seller";

import { ActionsButton } from "@components/common/actions-button";
import { SellerStatusBadge } from "@components/common/seller-status-badge";
import { _DataTable } from "@components/table/data-table";

import {
  ClassifiableVendorSeller,
  useClassifiedSellers,
  useInviteSeller,
  useUpdateSeller,
} from "@hooks/api/sellers";
import { useSellersTableQuery } from "@hooks/table/query";
import { useDataTable } from "@hooks/use-data-table";

import { formatDate } from "@lib/date";
import { validateEmail } from "@lib/validate-email";
import {
  BUSINESS_TYPE_LABEL,
  SellerBusinessType,
  getProductCount,
  getPublishedProductCount,
  getSellerBusinessType,
  hasLiveShop,
} from "@lib/seller-business-type";

const PAGE_SIZE = 10;

type SellersProps = VendorSeller & { store_status: string };

/**
 * "Marketplace Storefronts" (decision record 2026-07-14 §1.3).
 *
 * This list used to show every `seller` row, which meant every Business Owner
 * — someone who pays for a directory listing and sells nothing — appeared as a
 * "storefront". Their seller row exists because it is also their messaging
 * inbox and their vendor-dashboard login, so it is CORRECT data and must never
 * be deleted; it just isn't a storefront. The tabs below split the two, and
 * "Storefronts" (merchants who actually sell) is the default view.
 *
 * The signal is the seller's own commerce footprint — published products /
 * any products / a Stripe payout account — i.e. storefront parity with
 * `has_live_shop` on the public listing page. See @lib/seller-business-type.
 */
type TabValue = "merchant" | "business_owner" | "all";

const TABS: { value: TabValue; label: string }[] = [
  { value: "merchant", label: "Storefronts (merchants)" },
  { value: "business_owner", label: "Business Owners (no shop)" },
  { value: "all", label: "All seller accounts" },
];

type Row = ClassifiableVendorSeller & {
  business_type: SellerBusinessType;
  product_count: number;
  published_product_count: number;
  has_live_shop: boolean;
};

const matchesSearch = (row: Row, q: string) =>
  [row.name, row.email, row.handle].some((v) =>
    (v ?? "").toLowerCase().includes(q)
  );

const compareRows = (a: Row, b: Row, order?: string) => {
  const desc = !!order?.startsWith("-");
  const key = (order?.startsWith("-") ? order.slice(1) : order) || "created_at";

  const av = (a as unknown as Record<string, unknown>)[key];
  const bv = (b as unknown as Record<string, unknown>)[key];

  let cmp: number;
  if (key === "created_at") {
    cmp =
      new Date(String(av ?? 0)).getTime() - new Date(String(bv ?? 0)).getTime();
  } else {
    cmp = String(av ?? "")
      .toLowerCase()
      .localeCompare(String(bv ?? "").toLowerCase());
  }

  return desc ? -cmp : cmp;
};

export const SellersList = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  const [searchParams, setSearchParams] = useSearchParams();
  const { raw } = useSellersTableQuery({ pageSize: PAGE_SIZE });

  const {
    sellers,
    classified,
    isLoading,
    isError,
  } = useClassifiedSellers();

  // If the backend wouldn't give us the linked product/payout fields we cannot
  // tell the two apart — show every account rather than a misleading subset.
  const tab: TabValue = !classified
    ? "all"
    : ((searchParams.get("type") as TabValue) ?? "merchant");

  const setTab = (next: TabValue) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (next === "merchant") {
        params.delete("type");
      } else {
        params.set("type", next);
      }
      // A different tab is a different result set — never keep the old page.
      params.delete("offset");
      return params;
    });
  };

  const rows: Row[] = useMemo(
    () =>
      (sellers ?? []).map((s) => ({
        ...s,
        business_type: getSellerBusinessType(s),
        product_count: getProductCount(s),
        published_product_count: getPublishedProductCount(s),
        has_live_shop: hasLiveShop(s),
      })),
    [sellers]
  );

  const filtered = useMemo(() => {
    let out = rows;

    if (classified && tab !== "all") {
      out = out.filter((r) => r.business_type === tab);
    }

    const q = raw.q?.trim().toLowerCase();
    if (q) {
      out = out.filter((r) => matchesSearch(r, q));
    }

    return [...out].sort((a, b) => compareRows(a, b, raw.order));
  }, [rows, classified, tab, raw.q, raw.order]);

  const offset = Math.max(0, Number(raw.offset ?? 0) || 0);
  const page = useMemo(
    () => filtered.slice(offset, offset + PAGE_SIZE),
    [filtered, offset]
  );

  const merchantCount = useMemo(
    () => rows.filter((r) => r.business_type === "merchant").length,
    [rows]
  );

  const { mutateAsync: inviteSeller } = useInviteSeller();

  const columns = useColumns();

  const { table } = useDataTable({
    data: page,
    columns,
    count: filtered.length,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
  });

  const handleInvite = async () => {
    try {
      const isValid = validateEmail(email);
      if (!isValid) {
        return;
      }

      await inviteSeller({ email });
      toast.success("Invited!");
      setOpen(false);
      setEmail("");
    } catch {
      toast.error("Error!");
    }
  };

  return (
    <Container>
      <div className="flex items-center justify-between">
        <div>
          <Heading>Marketplace Storefronts</Heading>
          <Text className="text-ui-fg-subtle mt-1" size="small">
            {classified
              ? `${merchantCount} merchant${
                  merchantCount === 1 ? "" : "s"
                } sell on the marketplace. Business Owners keep a seller account for messaging and for editing their directory listing — they have no storefront, and their account must not be deleted.`
              : "Showing every seller account — the marketplace could not return product data, so merchants and Business Owners can't be told apart right now."}
          </Text>
        </div>
        <Drawer
          open={open}
          onOpenChange={(openChanged) => setOpen(openChanged)}
        >
          <Drawer.Trigger
            onClick={() => {
              setOpen(true);
            }}
            asChild
          >
            <Button>Invite</Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header />
            <Drawer.Body>
              <Heading>Invite Seller</Heading>
              <Text className="text-ui-fg-subtle" size="small">
                Invite a new seller to your store
              </Text>
              <div className="mt-6 flex flex-col gap-2">
                <Label>Email</Label>
                <Input
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button className="mt-6" onClick={handleInvite}>
                  Invite
                </Button>
              </div>
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>

      {classified && (
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map(({ value, label }) => (
            <Button
              key={value}
              size="small"
              variant={tab === value ? "primary" : "secondary"}
              onClick={() => setTab(value)}
            >
              {label}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-4 flex size-full flex-col overflow-hidden">
        <_DataTable
          table={table}
          columns={columns}
          count={filtered.length}
          pageSize={PAGE_SIZE}
          isLoading={isLoading}
          queryObject={raw}
          search
          pagination
          navigateTo={(row) => `/sellers/${row.id}`}
          orderBy={[
            { key: "email", label: "Email" },
            { key: "name", label: "Name" },
            { key: "created_at", label: "Created" },
          ]}
          noRecords={{
            title:
              tab === "business_owner"
                ? "No Business Owners"
                : "No storefronts",
            message:
              tab === "business_owner"
                ? "Every seller account here sells products."
                : "No seller account has products or a payout account yet.",
          }}
        />
        {isError && (
          <Text className="text-ui-fg-error p-4" size="small">
            Could not load seller accounts.
          </Text>
        )}
      </div>
    </Container>
  );
};

const columnHelper = createColumnHelper<Row>();

const useColumns = () => {
  const dialog = usePrompt();

  const navigate = useNavigate();

  const { mutateAsync: suspendSeller } = useUpdateSeller();

  const handleSuspend = async (seller: SellersProps) => {
    const res = await dialog({
      title:
        seller.store_status === "SUSPENDED"
          ? "Activate account"
          : "Suspend account",
      description:
        seller.store_status === "SUSPENDED"
          ? "Are you sure you want to activate this account?"
          : "Are you sure you want to suspend this account?",
      verificationText: seller.email || seller.name || "",
    });

    if (!res) {
      return;
    }

    if (seller.store_status === "SUSPENDED") {
      await suspendSeller({ id: seller.id, data: { store_status: "ACTIVE" } });
    } else {
      await suspendSeller({
        id: seller.id,
        data: { store_status: "SUSPENDED" },
      });
    }
  };

  return useMemo(
    () => [
      columnHelper.display({
        id: "email",
        header: "Email",
        cell: ({ row }) => row.original.email,
      }),
      columnHelper.display({
        id: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      }),
      columnHelper.display({
        id: "business_type",
        header: "Account type",
        cell: ({ row }) => (
          <Badge
            size="2xsmall"
            color={
              row.original.business_type === "merchant" ? "purple" : "blue"
            }
          >
            {BUSINESS_TYPE_LABEL[row.original.business_type]}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: "shop",
        header: "Shop",
        cell: ({ row }) => {
          const { has_live_shop, published_product_count, product_count } =
            row.original;

          if (has_live_shop) {
            return (
              <span className="text-ui-fg-base">
                Live · {published_product_count} published
              </span>
            );
          }

          if (product_count > 0) {
            return (
              <span className="text-ui-fg-subtle">
                Not live · {product_count} product
                {product_count === 1 ? "" : "s"}
              </span>
            );
          }

          return <span className="text-ui-fg-muted">No shop</span>;
        },
      }),
      columnHelper.display({
        id: "store_status",
        header: "Account Status",
        cell: ({ row }) => (
          <SellerStatusBadge status={row.original.store_status || "-"} />
        ),
      }),
      columnHelper.display({
        id: "created_at",
        header: "Created",
        cell: ({ row }) => formatDate(row.original.created_at),
      }),
      columnHelper.display({
        id: "actions",
        cell: ({ row }) => {
          return (
            <ActionsButton
              actions={[
                {
                  label: "Edit",
                  onClick: () => navigate(`/sellers/${row.original.id}/edit`),
                  icon: <PencilSquare />,
                },
                {
                  label:
                    row.original.store_status === "SUSPENDED"
                      ? "Activate account"
                      : "Suspend account",
                  onClick: () =>
                    handleSuspend(row.original as unknown as SellersProps),
                  icon: <User />,
                },
              ]}
            />
          );
        },
      }),
    ],
    []
  );
};
