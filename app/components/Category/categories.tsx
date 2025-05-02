import React, { useEffect, useState } from 'react';
import { fetchCategories } from '../../services/categoryService';
import CategoryList from '../../components/Category/categoryList';
import { Category } from '@/app/types/category';
import { useNavigate } from 'react-router-dom';


const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadCategories();
  }, []);

  const handleSelectCategory = (slug: string) => {
    navigate(`/category/${slug}`);
  };

  if (loading) return <div>Loading categories...</div>;

  return (
    <div className="categories-page">
      <h1>Product Categories</h1>
      <CategoryList 
        categories={categories} 
        onSelect={handleSelectCategory}
      />
    </div>
  );
};

export default CategoriesPage;