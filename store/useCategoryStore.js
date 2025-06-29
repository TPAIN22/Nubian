import { create } from 'zustand';
import axiosInstance from '../utils/axiosInstans';

const useCategoryStore = create((set) => ({
  categories: [],
  loading: false,
  error: null,

  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axiosInstance.get('/categories');
      const categories = response.data;
      const categoryMap = {};
      const topLevelCategories = [];

      categories.forEach(category => {
        categoryMap[category._id] = { ...category, children: [] };
      });

      categories.forEach(category => {
        if (category.parent) {
          categoryMap[category.parent._id]?.children.push(categoryMap[category._id]);
        } else {
          topLevelCategories.push(categoryMap[category._id]);
        }
      });
      
      set({ categories: topLevelCategories, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
}));

export default useCategoryStore; 