export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }
  
  export interface CartSummary {
    totalPrice: number;
    itemCount: number;
    shippingCost: number;
    tax: number;
  }