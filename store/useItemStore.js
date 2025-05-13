import { create } from "zustand";
import axiosInstance from "../utils/axiosInstans";

const useItemStore = create((set) => ({
  products: [],
  product: null,
  isProductsLoading: false,
  error: null,
  setProduct: (product) => set(() => ({ product })),
  setError: (error) => set(() => ({ error })),

  getProducts: async () => {
    set({isProductsLoading: true})
    try {
        const response = await axiosInstance.get("/products");
        set({products: response.data})
    } catch (error) {
        console.log(error)
        set({isProductsLoading: false})
    }
    finally{
        set({isProductsLoading: false})
    }
    
  },
}));

export default useItemStore;
