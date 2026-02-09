import axios from "axios";
import { getToken } from "@/utils/tokenManager";
import { resolveApiBaseUrl } from "@/services/api/baseUrl";

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Inject currency and country from store
      // We use require to avoid circular dependency if useCurrencyStore imports apiClient
      const { useCurrencyStore } = require("@/store/useCurrencyStore");
      const { currencyCode, countryCode } = useCurrencyStore.getState();
      
      if (currencyCode) {
        config.headers['x-currency'] = currencyCode;
      }
      if (countryCode) {
        config.headers['x-country'] = countryCode;
      }
    } catch (error) {
      if (__DEV__) console.warn("Token retrieval failed:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error?.response) {
      if (error?.code === "ECONNABORTED") {
        error.message = "Request timeout - the server took too long to respond";
      } else if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
        error.message = `Network error - unable to connect to server || "unknown"}`;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

