// Stays product|seller on purpose. This is the payload for the ORDER-GATED
// POST /store/reviews. Directory-listing reviews aren't tied to a purchase and
// go through POST /store/directory/listings/:id/reviews instead, which takes no
// order_id — so 'listing' is not a valid value here. Read shapes (ReviewDTO,
// Review) DO include it.
export type CreateReviewDTO = {
  order_id: string
  reference: 'product' | 'seller'
  reference_id: string
  rating: number
  customer_note: string | null
  customer_id: string
}

export type UpdateReviewDTO = {
  id: string
  rating?: number
  customer_note?: string
  seller_note?: string
}
