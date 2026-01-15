import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

interface ScrollContextType {
  scrollY: number;
  setScrollY: (y: number) => void;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

export const ScrollProvider = ({ children }: { children: ReactNode }) => {
  const [scrollY, setScrollY] = useState(0);

  return (
    <ScrollContext.Provider value={{ scrollY, setScrollY }}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    // Return default values if context not available
    return { scrollY: 0, setScrollY: (_y: number) => {} };
  }
  return context;
};

// Default export for route compatibility
export default ScrollProvider;
