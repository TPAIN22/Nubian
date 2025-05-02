import React from 'react';
import { Category } from '../../types/category';

interface CategoryListProps {
  categories: Category[];
  onSelect: (categorySlug: string) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, onSelect }) => {
  return (
    <div className="category-list">
      {categories.map((category) => (
        <div key={category.id} className="category-item">
          <button 
            onClick={() => onSelect(category.slug)}
            className="category-button"
          >
            {category.name}
          </button>
          
          {category.subcategories && (
            <div className="subcategory-list">
              {category.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => onSelect(sub.slug)}
                  className="subcategory-button"
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoryList;
// Note: The CSS classes used in this component should be defined in your CSS file to style the category list and buttons appropriately.