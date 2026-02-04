import { createContext, useContext, useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";
const STORAGE_NATAL_KEY = "arkana_natal_result";

function getNatalResultFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_NATAL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data?.ascendant != null ? data : null;
  } catch {
    return null;
  }
}

const NatalChartContext = createContext(null);

export function NatalChartProvider({ children }) {
  const [isCalculating, setIsCalculating] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);
  const [natalResult, setNatalResult] = useState(getNatalResultFromStorage);

  const startCalculation = useCallback(
    async (initData, { dateOfBirth, placeOfBirth }) => {
      if (!dateOfBirth || !placeOfBirth) return;
      setIsCalculating(true);
      setJustCalculated(false);
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
            setNatalResult({
              ascendant: data.ascendant,
              natalChart: data.natalChart,
            });
            setJustCalculated(true);
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

  const clearJustCalculated = useCallback(() => {
    setJustCalculated(false);
  }, []);

  return (
    <NatalChartContext.Provider
      value={{
        isCalculating,
        startCalculation,
        natalResult,
        justCalculated,
        clearJustCalculated,
      }}
    >
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
