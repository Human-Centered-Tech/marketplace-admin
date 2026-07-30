import { QueryKey, UseQueryOptions, useQuery } from "@tanstack/react-query";

import { sdk } from "../../lib/client";
import { queryKeysFactory } from "../../lib/query-key-factory";

export interface Review {
  id: string;
  rating: number;
  // 'listing' added 2026-07-28: directory-listing reviews share this table.
  // They reach the admin moderation queue through the same `review_remove`
  // request as the other two, so anything reading this type can now see one.
  reference: "seller" | "product" | "listing";
  customer_id: string;
  customer_note?: string | null;
  seller_note?: string | null;
}

export const reviewsQueryKeys = queryKeysFactory("reviews");

export const useReview = (
  id: string,
  options?: Omit<
    UseQueryOptions<unknown, Error, { review?: Review }, QueryKey>,
    "queryFn" | "queryKey"
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: reviewsQueryKeys.detail(id),
    queryFn: () =>
      sdk.client.fetch(`/admin/reviews/${id}`, {
        method: "GET",
      }),
    ...options,
  });

  return { ...data, ...other };
};
