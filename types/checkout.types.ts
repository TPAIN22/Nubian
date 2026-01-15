export type PaymentMethod = "CASH" | "BANKAK";
export type PaymentStatus = "PENDING" | "AWAITING_VERIFICATION" | "VERIFIED" | "REJECTED";
export type FulfillmentStatus = "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export interface Address {
  _id?: string;
  userId?: string;
  name: string;
  city: string;
  area: string;
  street: string;
  building?: string;
  phone: string;
  whatsapp: string;
  notes?: string;
  isDefault: boolean;
}

export interface ShippingRate {
  _id?: string;
  city: string;
  fee: number;
  currency: string;
  isActive: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  merchantId: string;
  image?: string;
  attributes?: Record<string, string>;
}

export interface SubOrder {
  _id?: string;
  parentOrderId?: string;
  merchantId: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
}

export interface Order {
  _id?: string;
  userId?: string;
  address: Address;
  items: OrderItem[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingFee: number;
  subtotal: number;
  total: number;
  currency: string;
  proofUrl?: string;
  subOrders: SubOrder[];
  status: "PLACED" | "PAID" | "REJECTED";
}

export interface QuoteResponse {
  address: Address;
  shippingRate: ShippingRate | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  currency: string;
  subOrders: Array<{
    merchantId: string;
    items: OrderItem[];
    subtotal: number;
    shippingFee: number;
    total: number;
  }>;
}
