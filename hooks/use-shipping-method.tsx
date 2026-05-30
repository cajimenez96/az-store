'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type ShippingMethod = 'retiro' | 'envio';

interface ShippingMethodContextType {
  shippingMethod: ShippingMethod;
  setShippingMethod: (method: ShippingMethod) => void;
}

const ShippingMethodContext = createContext<ShippingMethodContextType | undefined>(undefined);

export function ShippingMethodProvider({ children }: { children: ReactNode }) {
  const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('envio');

  return (
    <ShippingMethodContext.Provider value={{ shippingMethod, setShippingMethod }}>
      {children}
    </ShippingMethodContext.Provider>
  );
}

export function useShippingMethod() {
  const context = useContext(ShippingMethodContext);
  if (!context) {
    throw new Error('useShippingMethod must be used within ShippingMethodProvider');
  }
  return context;
}
