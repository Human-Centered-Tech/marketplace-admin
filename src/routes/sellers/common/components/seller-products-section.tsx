import { type ChangeEvent, useMemo, useRef, useState } from "react";

import { PencilSquare, Trash } from "@medusajs/icons";
import {
  Button,
  Container,
  Divider,
  Heading,
  toast,
  usePrompt,
} from "@medusajs/ui";

import { sdk } from "@lib/client";
import { createColumnHelper } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { AdminProductListResponse } from "@custom-types/product";
import type { AdminProduct } from "@custom-types/product/common";

import { ActionsButton } from "@components/common/actions-button";
import { ProductStatusBadge } from "@components/common/product-status-badge";
import { Thumbnail } from "@components/common/thumbnail";
import { _DataTable } from "@components/table/data-table";

import { useProductTableFilters } from "@hooks/table/filters";
import { useSellerOrdersTableQuery } from "@hooks/table/query";
import { useDataTable } from "@hooks/use-data-table";

const PAGE_SIZE = 10;
const PREFIX = "sp";

export const SellerProductsSection = ({
  seller_products,
  seller_id,
  refetch,
}: {
  seller_products: AdminProductListResponse;
  seller_id: string;
  refetch: () => void;
}) => {
  const { products, count } = seller_products;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Admin-side CSV import for THIS shop: posts the vendor-format CSV to
  // /admin/sellers/:id/product-import, which creates the products (as drafts)
  // attached to the seller and applies each variant's inventory quantity from
  // the "Variant Inventory Quantity" column. Lets Brooke bulk-load or migrate a
  // shop without the vendor's login.
  const handleImportFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so re-selecting the same file still fires onChange.
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;
    setImporting(true);
    try {
      const file_content = await file.text();
      const res = (await sdk.client.fetch(
        `/admin/sellers/${seller_id}/product-import`,
        { method: "POST", body: { file_content } },
      )) as { count?: number; stock_levels_set?: number };
      toast.success("Products imported", {
        description: `${res?.count ?? 0} product(s) created${
          typeof res?.stock_levels_set === "number"
            ? `, ${res.stock_levels_set} stock level(s) set`
            : ""
        }. They import as drafts — review and publish.`,
      });
      await refetch();
    } catch (err: unknown) {
      toast.error("Import failed", { description: (err as Error)?.message });
    } finally {
      setImporting(false);
    }
  };

  const { raw } = useSellerOrdersTableQuery({
    pageSize: PAGE_SIZE,
    offset: 0,
    prefix: PREFIX,
  });

  const columns = useColumns(refetch);
  const filters = useProductTableFilters();

  const { table } = useDataTable({
    data: products,
    columns,
    count,
    enablePagination: true,
    pageSize: PAGE_SIZE,
    getRowId: (row) => row?.id || "",
    prefix: PREFIX,
  });

  return (
    <Container className="mt-2 px-0">
      <div className="flex items-center justify-between px-8 pb-4">
        <Heading>Products</Heading>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Button
            size="small"
            variant="secondary"
            isLoading={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            Import CSV
          </Button>
        </div>
      </div>
      <Divider />
      <_DataTable
        filters={filters}
        table={table}
        columns={columns}
        count={count}
        pageSize={PAGE_SIZE}
        isLoading={false}
        queryObject={raw}
        search
        pagination
        navigateTo={(row) => `/products/${row.id}`}
        orderBy={[
          { key: "title", label: "Title" },
          { key: "created_at", label: "Created" },
          { key: "updated_at", label: "Updated" },
        ]}
        prefix={PREFIX}
      />
    </Container>
  );
};

const columnHelper = createColumnHelper<AdminProduct>();

const useColumns = (refetch: () => void) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const prompt = usePrompt();

  const handleDelete = async (product: AdminProduct) => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    });

    if (!res) {
      return;
    }

    try {
      await sdk.client.fetch(`/admin/products/${product.id}`, {
        method: "DELETE",
      });
      toast.success(t("products.toasts.delete.success.header"), {
        description: t("products.toasts.delete.success.description", {
          title: product.title,
        }),
      });
      await refetch();
    } catch (e: unknown) {
      toast.error(t("products.toasts.delete.error.header"), {
        description: (e as Error)?.message,
      });
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "product",
        header: "Product",
        cell: ({ row }) => {
          return (
            <div className="flex h-full w-full max-w-[250px] items-center gap-x-3 overflow-hidden">
              <div className="w-fit flex-shrink-0">
                <Thumbnail src={row.original.thumbnail} />
              </div>
              <span title={row.original.title} className="truncate">
                {row.original.title}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "collection",
        header: "Collection",
        cell: ({ row }) => {
          return row.original.collection?.title;
        },
      }),
      columnHelper.display({
        id: "variants",
        header: "Variants",
        cell: ({ row }) => {
          const variants = row.original.variants?.length || 0;
          const suffix = variants > 1 ? "variants" : "variant";

          return `${variants} ${suffix}`;
        },
      }),
      columnHelper.display({
        id: "status",
        header: "Status",
        cell: ({ row }) => <ProductStatusBadge status={row.original.status} />,
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <ActionsButton
            actions={[
              {
                label: "Edit",
                onClick: () => navigate(`/products/${row.original.id}/edit`),
                icon: <PencilSquare />,
              },
              {
                label: "Delete",
                onClick: () => handleDelete(row.original),
                icon: <Trash />,
              },
            ]}
          />
        ),
      }),
    ],
    [],
  );

  return columns;
};
