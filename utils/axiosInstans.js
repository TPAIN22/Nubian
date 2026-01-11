import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './tokenManager';

// Get API URL from environment variable
// This should be set via EXPO_PUBLIC_API_URL in .env or app.json
// Example: EXPO_PUBLIC_API_URL=http://192.168.0.115:5000/api or http://192.168.56.1:5000/api (development)
// EXPO_PUBLIC_API_URL=https://nubian-lne4.onrender.com/api (production)
// Force local server in development, even if EXPO_PUBLIC_API_URL is set
// This ensures we always use the local dev server when running locally
const baseURL = __DEV__ 
  ? "http://192.168.0.115:5000/api"  // Always use local server in development
  : (process.env.EXPO_PUBLIC_API_URL || "https://nubian-lne4.onrender.com/api");

// إعدادات التخزين المؤقت
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 ثانية

const axiosInstance = axios.create({
    baseURL,
    withCredentials: true,
    timeout: 15000, // 15 ثانية
    headers: {
        'Content-Type': 'application/json',
    }
});

// دالة للتأخير
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// دالة للتخزين المؤقت
const cacheResponse = async (key, data) => {
    try {
        const cacheData = {
            data,
            timestamp: Date.now()
        };
        await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
        console.warn('Cache storage failed:', error);
    }
};

const getCachedResponse = async (key) => {
    try {
        const cached = await AsyncStorage.getItem(`cache_${key}`);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }
    } catch (error) {
        console.warn('Cache retrieval failed:', error);
    }
    return null;
};

// دالة للـ retry
const retryRequest = async (config, retryCount = 0) => {
    try {
        return await axiosInstance(config);
    } catch (error) {
        if (retryCount < RETRY_ATTEMPTS && 
            (error.code === 'ECONNABORTED' || 
             error.response?.status >= 500 || 
             error.response?.status === 429)) {
            
            await delay(RETRY_DELAY * (retryCount + 1));
            return retryRequest(config, retryCount + 1);
        }
        throw error;
    }
};

// Request interceptor - automatically adds Clerk token to requests
axiosInstance.interceptors.request.use(
  async (config) => {
    // Add Clerk token if available
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Token retrieval failed:', error);
    }

    // Optional: Check cache for GET requests (disabled by default for real-time data)
    // Uncomment if you want to enable caching
    // if (config.method === 'get' && !config.skipCache) {
    //   const cacheKey = `${config.url}_${JSON.stringify(config.params || {})}`;
    //   const cachedData = await getCachedResponse(cacheKey);
    //   if (cachedData) {
    //     return Promise.resolve({
    //       data: cachedData,
    //       status: 200,
    //       statusText: 'OK',
    //       headers: {},
    //       config,
    //       fromCache: true
    //     });
    //   }
    // }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors and caching
axiosInstance.interceptors.response.use(
  async (response) => {
    // Optional: Cache GET requests (disabled by default)
    // Uncomment if you want to enable caching
    // if (response.config.method === 'get' && !response.config.skipCache && !response.fromCache) {
    //   const cacheKey = `${response.config.url}_${JSON.stringify(response.config.params || {})}`;
    //   await cacheResponse(cacheKey, response.data);
    // }

    return response;
  },
  async (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      // Provide more helpful error messages
      if (error.code === 'ECONNABORTED') {
        error.message = 'Request timeout - the server took too long to respond';
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        error.message = `Network error - unable to connect to server at ${error.config?.baseURL || 'unknown'}`;
      }
      
      return Promise.reject(error);
    }

    // Handle authentication errors
    if (error.response?.status === 401) {
      // Token is invalid or expired
      // Clerk will handle token refresh automatically
      if (__DEV__) {
        console.warn('Unauthorized request - token may be expired or invalid');
      }
    }

    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      console.warn(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    return Promise.reject(error);
  }
);

// دالة مساعدة لتنظيف التخزين المؤقت
export const clearCache = async () => {
    try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
    } catch (error) {
        console.warn('Cache clearing failed:', error);
    }
};

// دالة مساعدة للـ retry
export const retryRequestHelper = (config) => retryRequest(config);

export default axiosInstance;