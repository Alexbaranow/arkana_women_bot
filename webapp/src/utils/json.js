/**
 * Безопасный разбор JSON из строки (в т.ч. ответа fetch).
 * @param {string} text
 * @returns {object} распарсенный объект или {} при ошибке/пустоте
 */
export function parseJsonSafe(text) {
  if (typeof text !== "string" || !text.trim()) return {};
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}
