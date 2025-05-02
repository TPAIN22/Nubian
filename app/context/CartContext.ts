// import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

// // Define the shape of a cart item
// interface CartItem {
//   id: string;
//   name: string;
//   price: number;
//   quantity: number;
// }

// // Define the context type
// interface CartContextType {
//   items: CartItem[];
//   addItem: (product: { id: string; name: string; price: number }) => void;
//   removeItem: (id: string) => void;
//   updateQuantity: (id: string, quantity: number) => void;
//   clearCart: () => void;
//   total: number;
//   itemCount: number;
//   totalPrice: number; // Added totalPrice property
// }

// const CartContext = createContext<CartContextType | undefined>(undefined);

// export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
//   const [items, setItems] = useState<CartItem[]>([]);

//   const addItem = (product: { id: string; name: string; price: number }) => {
//     setItems(prev => {
//       const exists = prev.find(item => item.id === product.id);
//       if (exists) {
//         return prev.map(item => 
//           item.id === product.id 
//             ? { ...item, quantity: item.quantity + 1 } 
//             : item
//         );
//       }
//       return [...prev, { ...product, quantity: 1 }];
//     });
//   };

//   const removeItem = (id: string) => {
//     setItems(prev => prev.filter(item => item.id !== id));
//   };

//   const updateQuantity = (id: string, quantity: number) => {
//     setItems(prev => 
//       prev.map(item => 
//         item.id === id ? { ...item, quantity } : item
//       )
//     );
//   };

//   const clearCart = () => {
//     setItems([]);
//   };

//   const total = useMemo(() => {
//     return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
//   }, [items]);

//   const itemCount = useMemo(() => {
//     return items.reduce((count, item) => count + item.quantity, 0);
//   }, [items]);

//   const value = {
//     items,
//     addItem,
//     removeItem,
//     updateQuantity,
//     clearCart,
//     total,
//     itemCount,
//   };
// //   This is the Error im having
//   return (
//     <CartContext.Provider value={{ }}>
//       {children}
//     </CartContext.Provider>
//   );
// }

// export function useCart() {
//   const context = useContext(CartContext);
//   if (!context) throw new Error('useCart must be used within a CartProvider');
//   return context;
// }

// export default CartProvider;

