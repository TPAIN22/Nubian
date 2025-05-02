import React, { createContext, useReducer, ReactNode } from 'react';

// Define the shape of the cart state
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

interface CartContextProps {
  state: CartState;
  dispatch: React.Dispatch<any>;
}

// Initial state
const initialState: CartState = {
  items: [],
};

// Reducer function
function cartReducer(state: CartState, action: any): CartState {
  switch (action.type) {
    case 'ADD_TO_CART':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    default:
      return state;
  }
}

// Create context
export const CartContext = createContext<CartContextProps | undefined>(undefined);

// Provider component
export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  
};