import { create } from "zustand";
import axiosInstance from "../utils/axiosInstans";

const useItemStore = create((set , get) => ({
  products: [],
  product: null,
  isProductsLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  setProduct: (product) => set(() => ({ product })),
  setError: (error) => set(() => ({ error })),


  getProducts: async () => {
    const { page, hasMore, isProductsLoading } = get();
  
    if (!hasMore || isProductsLoading) return;
  
    set({ isProductsLoading: true });
  
    try {
      const response = await axiosInstance.get("/products", {
        params: { page, limit: 6 },
      });
      const newProducts = response.data.products;
      const totalPages = response.data.totalPages;
  
      set((state) => ({
        products: [...state.products, ...newProducts],
        page: state.page + 1,
        hasMore: state.page + 1 <= totalPages,
        isProductsLoading: false,
      }));
    } catch (error) {
      console.log(error);
      set({ isProductsLoading: false });
    }
  }
  
  
}));

export default useItemStore;
