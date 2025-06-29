import axiosInstance, { clearCache, retryRequestHelper } from '@/utils/axiosInstans';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('Axios Instance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
  });

  describe('Request Interceptor', () => {
    it('should add authorization header when token exists', async () => {
      const mockToken = 'test-token';
      await AsyncStorage.setItem('userToken', mockToken);

      const config = { 
        url: '/test', 
        method: 'get',
        headers: {}
      };
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);

      expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
    });

    it('should not add authorization header when token does not exist', async () => {
      const config = { 
        url: '/test', 
        method: 'get',
        headers: {}
      };
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should return cached response for GET requests', async () => {
      const cacheKey = '/test_{}';
      const cachedData = { test: 'data' };
      const cacheData = {
        data: cachedData,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(`cache_${cacheKey}`, JSON.stringify(cacheData));

      const config = { url: '/test', method: 'get', params: {} };
      const result = await axiosInstance.interceptors.request.handlers[0].fulfilled(config);

      expect(result.data).toEqual(cachedData);
      expect(result.fromCache).toBe(true);
    });
  });

  describe('Response Interceptor', () => {
    it('should cache GET responses', async () => {
      const response = {
        config: { url: '/test', method: 'get', params: {} },
        data: { test: 'data' }
      };

      await axiosInstance.interceptors.response.handlers[0].fulfilled(response);

      const cacheKey = '/test_{}';
      const cached = await AsyncStorage.getItem(`cache_${cacheKey}`);
      expect(cached).toBeTruthy();
    });

    it('should not cache non-GET responses', async () => {
      const response = {
        config: { url: '/test', method: 'post', params: {} },
        data: { test: 'data' }
      };

      await axiosInstance.interceptors.response.handlers[0].fulfilled(response);

      const cacheKey = '/test_{}';
      const cached = await AsyncStorage.getItem(`cache_${cacheKey}`);
      expect(cached).toBeNull();
    });

    it('should handle 401 errors by removing token', async () => {
      await AsyncStorage.setItem('userToken', 'test-token');
      
      const error = {
        response: { status: 401 },
        config: { url: '/test' }
      };

      try {
        await axiosInstance.interceptors.response.handlers[0].rejected(error);
      } catch (e) {
        // Expected to throw
      }

      const token = await AsyncStorage.getItem('userToken');
      expect(token).toBeNull();
    });
  });

  describe('Cache Functions', () => {
    it('should clear cache correctly', async () => {
      await AsyncStorage.setItem('cache_test1', 'data1');
      await AsyncStorage.setItem('cache_test2', 'data2');
      await AsyncStorage.setItem('other_key', 'data3');

      await clearCache();

      const test1 = await AsyncStorage.getItem('cache_test1');
      const test2 = await AsyncStorage.getItem('cache_test2');
      const other = await AsyncStorage.getItem('other_key');

      expect(test1).toBeNull();
      expect(test2).toBeNull();
      expect(other).toBe('data3');
    });
  });

  describe('Retry Logic', () => {
    it('should retry failed requests', async () => {
      const mockRequest = jest.fn();
      axiosInstance.request = mockRequest;
      
      mockRequest
        .mockRejectedValueOnce({ code: 'ECONNABORTED' })
        .mockResolvedValueOnce({ data: 'success' });

      const config = { url: '/test', method: 'get' };
      const result = await retryRequestHelper(config);

      expect(mockRequest).toHaveBeenCalledTimes(2);
      expect(result.data).toBe('success');
    });

    it('should not retry after max attempts', async () => {
      const mockRequest = jest.fn();
      axiosInstance.request = mockRequest;
      mockRequest.mockRejectedValue({ code: 'ECONNABORTED' });

      const config = { url: '/test', method: 'get' };
      
      await expect(retryRequestHelper(config)).rejects.toThrow();
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });
  });
}); 