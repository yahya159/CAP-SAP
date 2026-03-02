import React, { createContext, useContext, useEffect, useState } from 'react';

export type Density = 'comfortable' | 'compact';

interface DensityContextType {
  density: Density;
  setDensity: (density: Density) => void;
  toggleDensity: () => void;
}

const DensityContext = createContext<DensityContextType | undefined>(undefined);

export const DensityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [density, setDensity] = useState<Density>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('ui-density');
      if (saved === 'compact' || saved === 'comfortable') {
        return saved as Density;
      }
    }
    return 'comfortable';
  });

  useEffect(() => {
    window.localStorage.setItem('ui-density', density);
    if (density === 'compact') {
      document.body.classList.add('density-compact');
      document.body.classList.remove('density-comfortable');
    } else {
      document.body.classList.add('density-comfortable');
      document.body.classList.remove('density-compact');
    }
  }, [density]);

  const toggleDensity = () => {
    setDensity((prev) => (prev === 'comfortable' ? 'compact' : 'comfortable'));
  };

  return (
    <DensityContext.Provider value={{ density, setDensity, toggleDensity }}>
      {children}
    </DensityContext.Provider>
  );
};

export const useDensity = () => {
  const context = useContext(DensityContext);
  if (context === undefined) {
    throw new Error('useDensity must be used within a DensityProvider');
  }
  return context;
};
