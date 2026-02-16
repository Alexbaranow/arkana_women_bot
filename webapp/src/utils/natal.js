/**
 * Парсинг и чтение натальных данных (асцендент + натальная карта).
 * Профиль и карта дня используют getDisplayNatal для единообразного отображения и отправки в API.
 */

/** Парсит ascendant из объекта или JSON-строки */
function parseAscendant(raw) {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const sign = String(raw.sign ?? "").trim();
    const description = String(raw.description ?? "").trim();
    return sign || description ? { sign, description } : null;
  }
  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      const asc = parsed?.ascendant ?? parsed;
      return parseAscendant(asc);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Извлекает читаемые данные из сырого natalResult (контекст или localStorage).
 * Учитывает вложенный JSON в natalChart.
 * @returns {{ ascendant: { sign, description }, natalChart: string } | null}
 */
export function getDisplayNatal(natalResult) {
  if (!natalResult) return null;
  const natalChartStr =
    typeof natalResult.natalChart === "string"
      ? natalResult.natalChart.trim()
      : "";
  let ascendant = parseAscendant(natalResult.ascendant);
  let chartText =
    typeof natalResult.natalChart === "string" ? natalResult.natalChart : "";

  if (natalChartStr.startsWith("{")) {
    try {
      const parsed = JSON.parse(natalChartStr);
      const fromChart = parseAscendant(parsed.ascendant);
      if (fromChart) ascendant = fromChart;
      chartText =
        typeof parsed.natalChart === "string" ? parsed.natalChart.trim() : "";
    } catch {
      chartText = natalChartStr;
    }
  }

  if (ascendant || chartText) {
    return {
      ascendant: ascendant || { sign: "", description: "" },
      natalChart: chartText,
    };
  }
  return null;
}

export const STORAGE_NATAL_KEY = "arkana_natal_result";

/** Читает сырые натальные данные из localStorage (ключ как в NatalChartContext) */
export function getNatalResultFromStorage() {
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

/** Для карты дня: читает из localStorage и возвращает готовый объект { ascendant, natalChart } или null */
export function getNatalForCardDay() {
  const raw = getNatalResultFromStorage();
  return raw ? getDisplayNatal(raw) : null;
}

/** Есть ли достаточно данных для запроса карты дня */
export function hasNatalForCardDay(displayNatal) {
  if (!displayNatal) return false;
  const a = displayNatal.ascendant;
  const chart = displayNatal.natalChart?.trim() ?? "";
  return (a && (a.sign || a.description)) || chart.length > 0;
}
