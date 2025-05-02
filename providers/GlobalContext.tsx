import React, { createContext, useContext, useReducer } from "react";

// Define initial state
const initialState: GlobalState = {
  user: null,
  cart: [],
  notifications: [],
};

// Define actions
const actions = {
  SET_USER: "SET_USER",
  ADD_TO_CART: "ADD_TO_CART",
  REMOVE_FROM_CART: "REMOVE_FROM_CART",
  ADD_NOTIFICATION: "ADD_NOTIFICATION",
  CLEAR_NOTIFICATIONS: "CLEAR_NOTIFICATIONS",
};

// Create reducer
function reducer(state: { cart: any[]; notifications: any; }, action: { type: any; payload: any; }) {
  switch (action.type) {
    case actions.SET_USER:
      return { ...state, user: action.payload };
    case actions.ADD_TO_CART:
      return { ...state, cart: [...state.cart, action.payload] };
    case actions.REMOVE_FROM_CART:
      return {
        ...state,
        cart: state.cart.filter((item) => item.id !== action.payload),
      };
    case actions.ADD_NOTIFICATION:
      return { ...state, notifications: [...state.notifications, action.payload] };
    case actions.CLEAR_NOTIFICATIONS:
      return { ...state, notifications: [] };
    default:
      return state;
  }
}

// Create context
interface GlobalState {
  user: any;
  cart: any[];
  notifications: any[];
}

interface GlobalContextType {
  state: GlobalState;
  dispatch: React.Dispatch<{ type: string; payload: any }>;
}

const GlobalContext = createContext<GlobalContextType>({
  state: initialState,
  dispatch: () => null, // Placeholder function
});

// Create provider
export function GlobalProvider({ children }: React.PropsWithChildren<{}>) {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <GlobalContext.Provider value={{ state , dispatch }}>
      {children}
    </GlobalContext.Provider>
  );
}

// Custom hook to use global context
export function useGlobalContext() {
  return useContext(GlobalContext);
}