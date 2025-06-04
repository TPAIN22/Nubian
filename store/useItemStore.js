import { create } from "zustand";
import axiosInstance from "../utils/axiosInstans";

const useItemStore = create((set , get) => ({
  products: [],
  product: null,
  isProductsLoading: false,
  error: null,
  page: 1,
  hasMore: true,
  isTabBarVisible: true,
  signInModelVisible: false,

  setSignInModelVisible: (visible) => set(() => ({ signInModelVisible: visible })),

  setIsTabBarVisible: (visible) => set(() => ({ isTabBarVisible: visible })),
  setProduct: (product) => set(() => ({ product })),
  setError: (error) => set(() => ({ error })),
  


 getProducts: async () => {
    const { page, hasMore, isProductsLoading } = get();
    if (!hasMore || isProductsLoading) {
      return;
    }
 
    set({ isProductsLoading: true });
 
    try {
      const response = await axiosInstance.get("/products", {
        params: { page, limit: 6 },
      });
      const newProducts = response.data.products;
      const totalPages = response.data.totalPages;
 
      set((state) => {
        const nextHasMore = state.page + 1 <= totalPages;
        return {
          products: [...state.products, ...newProducts],
          page: state.page + 1,
          hasMore: nextHasMore,
          isProductsLoading: false,
        };
      });
    } catch (error) {
      set({ isProductsLoading: false, error: error.message });
    }
  }
  
  
}));

export default useItemStore;
