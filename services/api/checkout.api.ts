import apiClient from "./client";
import type { QuoteResponse } from "@/types/checkout.types";

/**
 * Checkout quote — the only live export of this module.
 *
 * Order placement, address CRUD, and order history are owned by their Zustand
 * stores (useOrderStore / useAddressStore), not this file. The previous
 * fetchOrders/createOrder/uploadPaymentProof/fetchSubOrders/listShippingRates
 * helpers were unused and pointed at routes that don't exist on the backend
 * (/orders, /orders/:id/payment-proof, /suborders, /shipping/rates), so they
 * were removed to avoid copy-paste landmines.
 */
export async function quoteCheckout(params: { addressId: string; items: any[] }): Promise<QuoteResponse> {
  const res = await apiClient.post("checkout/quote", params);
  // Backend wraps responses in { success, data, ... } via lib/response.js, so the
  // quote object (subtotal/shippingFee/total/…) lives under res.data.data.
  // Returning res.data here meant callers read quote.subtotal off the envelope
  // and got undefined. Fall back to res.data to tolerate a raw shape too.
  return res.data?.data ?? res.data;
}
