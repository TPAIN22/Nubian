import axios from "axios";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get API URL from environment variable
// This should be set via EXPO_PUBLIC_API_URL in .env or app.json
// Example: EXPO_PUBLIC_API_URL=http://192.168.0.115:5000/api (development)
// EXPO_PUBLIC_API_URL=https://nubian-lne4.onrender.com/api (production)
const baseURL = process.env.EXPO_PUBLIC_API_URL || "https://nubian-lne4.onrender.com/api";

// Validate API URL is configured
if (!process.env.EXPO_PUBLIC_API_URL && __DEV__) {
  console.warn('EXPO_PUBLIC_API_URL is not set. Using default production URL. Set EXPO_PUBLIC_API_URL in .env for development.');
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

// Request interceptor
// axiosInstance.interceptors.request.use(
//   async (config) => {
//     // إضافة token إذا كان متوفر
//     try {
//       const token = await AsyncStorage.getItem('userToken');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     } catch (error) {
//       console.warn('Token retrieval failed:', error);
//     }

//     // التحقق من التخزين المؤقت للـ GET requests
//     if (config.method === 'get' && !config.skipCache) {
//       const cacheKey = `${config.url}_${JSON.stringify(config.params || {})}`;
//       const cachedData = await getCachedResponse(cacheKey);
//       if (cachedData) {
//         return Promise.resolve({
//           data: cachedData,
//           status: 200,
//           statusText: 'OK',
//           headers: {},
//           config,
//           fromCache: true
//         });
//       }
//     }

//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// Response interceptor
// axiosInstance.interceptors.response.use(
//   async (response) => {
//     // تخزين البيانات في التخزين المؤقت للـ GET requests
//     if (response.config.method === 'get' && !response.config.skipCache && !response.fromCache) {
//       const cacheKey = `${response.config.url}_${JSON.stringify(response.config.params || {})}`;
//       await cacheResponse(cacheKey, response.data);
//     }

//     return response;
//   },
//   async (error) => {
//     // معالجة أخطاء محددة
//     if (error.response?.status === 401) {
//       // حذف token غير صالح
//       try {
//         await AsyncStorage.removeItem('userToken');
//       } catch (storageError) {
//         console.warn('Token removal failed:', storageError);
//       }
//     }

//     // تسجيل الأخطاء في development
//     if (process.env.NODE_ENV !== 'production') {
//       console.error('API Error:', {
//         url: error.config?.url,
//         method: error.config?.method,
//         status: error.response?.status,
//         message: error.message,
//         data: error.response?.data
//       });
//     }

//     return Promise.reject(error);
//   }
// );

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