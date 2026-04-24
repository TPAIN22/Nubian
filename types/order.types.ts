export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "BANKAK" | "CASH" | string;

export interface ProductDetails {
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;

  city?: string;
  address?: string;

  productsDetails: ProductDetails[];
  productsCount?: number;

  paymentProofUrl?: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  addressId?: string;
  items: CartItem[];
  paymentMethod: PaymentMethod;

  transferProof?: string | null;
  proofFileUri?: string;

  shippingAddress?: string;
  phoneNumber?: string;
  couponCode?: string;

  paymentProofUrl?: string;
}