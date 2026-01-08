import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from './tokenManager';

// Get API URL from environment variable
// This should be set via EXPO_PUBLIC_API_URL in .env or app.json
// Example: EXPO_PUBLIC_API_URL=http://192.168.0.115:5000/api (development)
// EXPO_PUBLIC_API_URL=https://nubian-lne4.onrender.com/api (production)
const baseURL = process.env.EXPO_PUBLIC_API_URL || "https://nubian-lne4.onrender.com/api";

// Validate API URL is configured
if (!process.env.EXPO_PUBLIC_API_URL && __DEV__) {
  console.warn('⚠️ EXPO_PUBLIC_API_URL is not set. Using default production URL:', baseURL);
  console.warn('💡 Set EXPO_PUBLIC_API_URL in .env file for development, e.g.:');
  console.warn('   EXPO_PUBLIC_API_URL=http://192.168.0.115:5000/api');
}

// Log the API URL being used (only the domain for security)
if (__DEV__) {
  try {
    const url = new URL(baseURL);
    console.log('📡 API Base URL:', `${url.protocol}//${url.host}`);
  } catch (e) {
    console.warn('⚠️ Invalid API URL format:', baseURL);
  }
}
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
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
        method: error.config?.method,
        timeout: error.code === 'ECONNABORTED' ? 'Request timeout' : 'Connection failed',
      });
      
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

    // Log errors in development (but skip 404 for carts as it's expected when cart is empty)
    if (__DEV__) {
      // Don't log 404 errors for cart endpoints as they're expected (empty cart)
      if (error.response?.status === 404 && error.config?.url?.includes('/carts')) {
        // Silently handle - cart not found is normal for empty carts
        return Promise.reject(error);
      }
      console.error('API Error:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
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