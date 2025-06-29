// Type definitions for JavaScript files
declare module '*.js' {
  const content: any;
  export default content;
}

declare module '*.jsx' {
  const content: any;
  export default content;
}

// Store types
declare module '@/store/useItemStore' {
  const useItemStore: any;
  export default useItemStore;
}

declare module '@/store/useCategoryStore' {
  const useCategoryStore: any;
  export default useCategoryStore;
}

declare module '@/store/useCartStore' {
  const useCartStore: any;
  export default useCartStore;
}

declare module '@/store/useCategoryStore' {
  const useCategoryStore: any;
  export default useCategoryStore;
}

declare module '@/store/orderStore' {
  const orderStore: any;
  export default orderStore;
}

// Utils types
declare module '@/utils/axiosInstans' {
  const axiosInstance: any;
  export default axiosInstance;
}

declare module '@/utils/i18n' {
  const i18n: any;
  export default i18n;
}

// Components types
declare module '@/app/components/*' {
  const component: any;
  export default component;
}

// Styles types
declare module '@/app/components/styles' {
  const styles: any;
  export default styles;
} 