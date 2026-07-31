export type ReviewDTO = {
  id: string
  // 'listing' added 2026-07-28 — directory-listing reviews are rows in the same
  // `review` table (see context/directory-listing-reviews-2026-07-28.md).
  reference: 'product' | 'seller' | 'listing'
  rating: number
  customer_note: string | null
  customer_id: string
  seller_note: string | null
  created_at: Date
  updated_at: Date | null
}
