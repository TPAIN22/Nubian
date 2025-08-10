import { useState } from 'react';
import axiosInstance from '../utils/axiosInstans';

const API_URL = '/brands'; // لأن baseURL معرف في axiosInstance

const useBrandStore = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBrands = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(API_URL);
      setBrands(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { brands, fetchBrands, loading, error };
};

export default useBrandStore; 