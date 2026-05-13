import React, { createContext, useContext } from 'react';
import { useBusinessSetup } from '../hooks/useBusinessSetup';

const BusinessSetupContext = createContext(null);

export const BusinessSetupProvider = ({ children }) => {
  const setup = useBusinessSetup();

  return (
    <BusinessSetupContext.Provider value={setup}>
      {children}
    </BusinessSetupContext.Provider>
  );
};

export const useBusinessSetupContext = () => {
  const context = useContext(BusinessSetupContext);
  if (!context) {
    throw new Error('useBusinessSetupContext must be used within a BusinessSetupProvider');
  }
  return context;
};
