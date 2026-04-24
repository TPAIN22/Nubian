import axiosInstance from "@/services/api/client";
import { Order, CreateOrderPayload } from "@/types/order.types";

/* ================= API ================= */

export const fetchOrders = async (): Promise<Order[]> => {
  const { data } = await axiosInstance.get("/orders");
  return data;
};

export const fetchOrderById = async (id: string): Promise<Order> => {
  const { data } = await axiosInstance.get(`/orders/${id}`);
  return data;
};

export const createOrder = async (
  payload: CreateOrderPayload
): Promise<Order> => {
  const { data } = await axiosInstance.post("/orders", payload);
  return data;
};

export const uploadPaymentProof = async (
  orderId: string,
  file: { uri: string }
): Promise<Order> => {
  const formData = new FormData();
  formData.append("file", {
    uri: file.uri,
    type: "image/jpeg",
    name: "proof.jpg",
  } as any);

  const { data } = await axiosInstance.post(
    `/orders/${orderId}/upload-proof`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return data;
};