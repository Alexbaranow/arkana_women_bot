/**
 * Изображения карт Таро для отображения после расчёта асцендента и натальной карты.
 *
 * ОТЛАДКА: пока в img только две картинки — показываем одну из них.
 * Позже: по ответу нейросети (знак асцендента / арканы натальной карты) будем
 * подставлять соответствующую карту из полного набора.
 */

import cardDebug1 from "../img/2026-02-06 14.32.15.jpg";
import cardDebug2 from "../img/2026-02-06 14.32.31.jpg";

/** Для отладки: список карт, из которых пока выбираем любую */
export const DEBUG_TAROT_CARD_IMAGES = [cardDebug1, cardDebug2];

/**
 * Возвращает URL изображения карты Таро для результата расчёта.
 * Сейчас для отладки возвращаем первую из двух доступных карт.
 * TODO: по displayNatal (ascendant.sign, natalChart) определять нужную карту и возвращать её изображение.
 *
 * @param {object} displayNatal - { ascendant: { sign, description }, natalChart: string }
 * @returns {string} URL изображения карты
 */
export function getTarotCardImageForNatal(displayNatal) {
  // ОТЛАДКА: пока не маппим ответ на карту — берём первую из двух
  return DEBUG_TAROT_CARD_IMAGES[0];
}

/**
 * Извлекает название карты Таро из текста ответа нейросети.
 * Паттерны: "аркан Повешенный (XII)", "Повешенный (XII)", "карта X" и т.п.
 * @param {string} text - текст ответа
 * @returns {string|null} название карты или null
 */
export function parseCardNameFromText(text) {
  if (typeof text !== "string" || !text.trim()) return null;
  const m = text.match(/аркан\s+([^,.]+?)(?:\s*\([IVXLCDM\d]+\))?|([А-Яа-яЁё][^,.]+?)\s*\([IVXLCDM\d]+\)/i);
  return m ? (m[1] || m[2] || "").trim() || null : null;
}

/**
 * Возвращает URL изображения карты дня по тексту ответа.
 * Пока колода не собрана — возвращаем заглушку.
 * @param {string} text - текст ответа (для парсинга имени карты)
 * @returns {string} URL изображения
 */
export function getCardImageForCardDay(text) {
  // TODO: маппинг parseCardNameFromText(text) → изображение из колоды
  return cardDebug2; // 2026-02-06 14.32.31.jpg
}
