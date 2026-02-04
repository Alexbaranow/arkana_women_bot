import { createContext, useContext, useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";
const STORAGE_NATAL_KEY = "arkana_natal_result";

const NatalChartContext = createContext(null);

export function NatalChartProvider({ children }) {
  const [isCalculating, setIsCalculating] = useState(false);

  const startCalculation = useCallback(
    async (initData, { dateOfBirth, placeOfBirth }) => {
      if (!dateOfBirth || !placeOfBirth) return;
      setIsCalculating(true);
      try {
        const res = await fetch(`${API_URL}/api/calculate-natal`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData: initData || undefined,
            dateOfBirth,
            placeOfBirth: placeOfBirth.trim(),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ascendant != null) {
          try {
            localStorage.setItem(
              STORAGE_NATAL_KEY,
              JSON.stringify({
                ascendant: data.ascendant,
                natalChart: data.natalChart,
              })
            );
          } catch {}
        }
      } catch {
        // Сеть или сервер — индикатор всё равно скроется
      } finally {
        setIsCalculating(false);
      }
    },
    []
  );

  return (
    <NatalChartContext.Provider value={{ isCalculating, startCalculation }}>
      {children}
    </NatalChartContext.Provider>
  );
}

export function useNatalChart() {
  const ctx = useContext(NatalChartContext);
  if (!ctx) {
    throw new Error("useNatalChart must be used within NatalChartProvider");
  }
  return ctx;
}
