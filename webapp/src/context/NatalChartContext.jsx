import { createContext, useContext, useState, useCallback } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";
const STORAGE_NATAL_KEY = "arkana_natal_result";

function getNatalResultFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_NATAL_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const hasData = data?.ascendant != null || (data?.natalChart ?? "").trim();
    return hasData ? data : null;
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
    async (initData, { dateOfBirth, placeOfBirth, timeOfBirth }) => {
      if (!dateOfBirth || !placeOfBirth) return;
      setIsCalculating(true);
      setJustCalculated(false);
      const payload = {
        initData: initData || undefined,
        dateOfBirth,
        placeOfBirth: placeOfBirth.trim(),
        ...(timeOfBirth && { timeOfBirth: String(timeOfBirth).trim() }),
      };
      const opts = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      };
      try {
        const [ascRes, chartRes] = await Promise.all([
          fetch(`${API_URL}/api/calculate-ascendant`, opts),
          fetch(`${API_URL}/api/calculate-natal-chart`, opts),
        ]);
        const ascData = await ascRes.json().catch(() => ({}));
        const chartData = await chartRes.json().catch(() => ({}));
        const ascendant =
          ascRes.ok && ascData?.ascendant != null
            ? ascData.ascendant
            : { sign: "", description: "" };
        const natalChart =
          chartRes.ok && chartData?.natalChart != null
            ? chartData.natalChart
            : "";
        const hasResult =
          ascendant?.sign || ascendant?.description || natalChart;
        if (hasResult) {
          try {
            localStorage.setItem(
              STORAGE_NATAL_KEY,
              JSON.stringify({ ascendant, natalChart: natalChart || "" })
            );
            setNatalResult({ ascendant, natalChart: natalChart || "" });
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
