interface Category {
    id: string;
    name: string;
    slug: string;
    subcategories?: Subcategory[];
  }
  
  interface Subcategory {
    id: string;
    name: string;
    slug: string;
    parentCategory: string;
  }
  
  // Alternatively, using a nested structure
  interface CategoryTree {
    id: string;
    name: string;
    slug: string;
    children?: CategoryTree[];
  }

export type { Category, Subcategory, CategoryTree };