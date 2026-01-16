import apiClient from "./client";
import type { Address, QuoteResponse, Order, SubOrder } from "@/types/checkout.types";

export async function fetchAddresses(): Promise<Address[]> {
  const res = await apiClient.get("/addresses");
  return res.data;
}

export async function createAddress(payload: Partial<Address>): Promise<Address> {
  const res = await apiClient.post("/addresses", payload);
  return res.data;
}

export async function updateAddress(id: string, payload: Partial<Address>): Promise<Address> {
  const res = await apiClient.put(`/addresses/${id}`, payload);
  return res.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/addresses/${id}`);
}

export async function listShippingRates() {
  const res = await apiClient.get("/shipping/rates");
  return res.data;
}

export async function quoteCheckout(params: { addressId: string; items: any[] }): Promise<QuoteResponse> {
  const res = await apiClient.post("/checkout/quote", params);
  return res.data;
}

export async function createOrder(payload: {
  addressId: string;
  items: any[];
  paymentMethod: "CASH" | "BANKAK";
  transferProof?: string;
}): Promise<Order> {
  const res = await apiClient.post("/orders", payload);
  return res.data;
}

export async function uploadPaymentProof(orderId: string, file: { uri: string; name?: string; type?: string }) {
  const form = new FormData();
  const filename = file.name || "receipt.jpg";
  form.append("file", { uri: file.uri, name: filename, type: file.type || "image/jpeg" } as any);
  const res = await apiClient.post(`/orders/${orderId}/payment-proof`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await apiClient.get("/orders/my-orders");
  return res.data;
}

export async function fetchOrderById(id: string): Promise<Order> {
  const res = await apiClient.get(`/orders/${id}`);
  return res.data;
}

export async function fetchSubOrders(): Promise<SubOrder[]> {
  const res = await apiClient.get("/suborders");
  return res.data;
}

export async function updateSubOrderStatus(id: string, status: string) {
  const res = await apiClient.patch(`/suborders/${id}/fulfillment-status`, { status });
  return res.data;
}
