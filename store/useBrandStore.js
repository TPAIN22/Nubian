import { useState } from 'react';
import axiosInstance from '../utils/axiosInstans';

const API_URL = '/merchant'; // لأن baseURL معرف في axiosInstance

const usemerchanttore = () => {
  const [merchant, setmerchant] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchmerchant = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosInstance.get(API_URL);
      setmerchant(response.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return { merchant, fetchmerchant, loading, error };
};

export default usemerchanttore; 