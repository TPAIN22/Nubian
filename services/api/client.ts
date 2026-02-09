import axios from "axios";
import { getToken } from "@/utils/tokenManager";
import { resolveApiBaseUrl } from "@/services/api/baseUrl";

// Custom fetch adapter to fix Android SSL/TLS issues with Render
// This bypasses the old XMLHttpRequest implementation
const fetchAdapter = async (config: any) => {
  // Axios separates baseURL and url, but fetch needs the full URL
  let fullUrl = config.url;
  if (config.baseURL && !fullUrl.startsWith('http')) {
    fullUrl = `${config.baseURL}${fullUrl}`.replace(/([^:]\/)\/+/g, "$1"); // remove double slashes
  }

  const response = await fetch(fullUrl, {
    method: config.method.toUpperCase(),
    headers: config.headers,
    body: config.data,
  });

  const responseText = await response.text();
  let responseData = responseText;
  
  try {
    responseData = JSON.parse(responseText);
  } catch (e) {
    // Keep as text if not JSON
  }

  return {
    data: responseData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
    config,
    request: null,
  };
};

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  adapter: fetchAdapter as any, // Use our custom adapter
  withCredentials: true,
  timeout: 15_000,
  headers: { 
    "Content-Type": "application/json",
    "User-Agent": "NubianApp/1.0"
  },
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

      if (__DEV__) {
        console.log("API Request:", {
          method: config.method?.toUpperCase(),
          baseURL: config.baseURL,
          url: config.url,
          headers: config.headers,
        });
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
    if (__DEV__) {
      console.log("API Error Details:", {
        code: error.code,
        message: error.message,
        status: error.response?.status,
        url: error.config?.url,
        data: error.response?.data
      });
    }

    if (!error?.response) {
      if (error?.code === "ECONNABORTED") {
        error.message = "Request timeout - the server took too long to respond";
      } else if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
        error.message = 'Network error - unable to connect to server || "unknown"';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

