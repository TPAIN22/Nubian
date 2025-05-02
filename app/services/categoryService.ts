import { Category } from "../types/category";

const mockCategories: Category[] = [
    {
      id: '1',
      name: 'Electronics',
      slug: 'electronics',
      subcategories: [
        { id: '1-1', name: 'Smartphones', slug: 'smartphones', parentCategory: '1' },
        { id: '1-2', name: 'Laptops', slug: 'laptops', parentCategory: '1' },
      ],
    },
    {
      id: '2',
      name: 'Clothing',
      slug: 'clothing',
      subcategories: [
        { id: '2-1', name: 'Men', slug: 'men', parentCategory: '2' },
        { id: '2-2', name: 'Women', slug: 'women', parentCategory: '2' },
      ],
    },
  ];
  
  export const fetchCategories = async (): Promise<Category[]> => {
    // Simulate API call
    return new Promise(resolve => 
      setTimeout(() => resolve(mockCategories), 500)
    );
  };