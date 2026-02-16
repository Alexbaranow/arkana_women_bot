/**
 * Единая точка доступа к базовому URL API (DRY).
 */
export function getApiUrl() {
  return import.meta.env.VITE_API_URL || "";
}
