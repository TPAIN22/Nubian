// providers/NetworkProvider.tsx

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode, // إضافة ReactNode لاستخدامه في props
} from "react";
import * as Network from "expo-network";
import { EventSubscription } from "expo-modules-core";
import i18n from "@/utils/i18n";
import { toast } from "sonner-native";

// 1. تعريف أنواع الـ Context
interface NetworkContextType {
  isConnected: boolean | null;
  isNetworkChecking: boolean; // لتمييز حالة التحقق الأولي
  retryNetworkCheck: () => void;
}

// 2. إنشاء Context
const NetworkContext = createContext<NetworkContextType | null>(null);

// 3. هوك مخصص لاستخدام الـ Context
export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
};

// 4. مكون الـ Provider
interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const isShowingNoNetworkAlert = useRef(false); // لمنع ظهور تنبيهات متعددة

  const checkNetworkStatus = useCallback(async () => {
    try {
      const networkState = await Network.getNetworkStateAsync();
      const connected = Boolean(
        networkState.isConnected && networkState.isInternetReachable
      );
      setIsConnected(connected);
    } catch (error) {
      setIsConnected(false); // افتراض عدم الاتصال في حالة الخطأ
    }
  }, []);

  // تحقق من حالة الشبكة عند تحميل المكون لأول مرة
  useEffect(() => {
    checkNetworkStatus();
  }, [checkNetworkStatus]);

  // الاستماع لتغييرات حالة الشبكة
  useEffect(() => {
    let unsubscribe: EventSubscription | undefined;

    // لا نبدأ بالاستماع حتى نتأكد من الحالة الأولية للاتصال
    if (isConnected !== null) {
      unsubscribe = Network.addNetworkStateListener((status) => {
        const newConnected = Boolean(
          status.isConnected && status.isInternetReachable
        );

        // إذا كان الاتصال مفقوداً و لم نظهر التنبيه بعد
        if (newConnected === false && !isShowingNoNetworkAlert.current) {
          isShowingNoNetworkAlert.current = true;
          toast.error(i18n.t('networkLostTitle'), i18n.t('networkLostMessage'));
        }
        // إذا تم استعادة الاتصال و كان هناك تنبيه ظاهر
        else if (newConnected === true && isShowingNoNetworkAlert.current) {
          toast.success(i18n.t('networkRestoredTitle'), i18n.t('networkRestoredMessage'));
          isShowingNoNetworkAlert.current = false;
          setIsConnected(true); 
        }
        else if (newConnected !== isConnected) {
            setIsConnected(newConnected);
        }
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe.remove();
      }
    };
  }, [isConnected]); 

  const retryNetworkCheck = useCallback(() => {
    setIsConnected(null); 
    checkNetworkStatus();
  }, [checkNetworkStatus]);

  const contextValue: NetworkContextType = {
    isConnected,
    isNetworkChecking: isConnected === null, 
    retryNetworkCheck,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};