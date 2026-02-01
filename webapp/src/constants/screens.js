/**
 * Идентификаторы экранов приложения
 */
export const ScreenId = Object.freeze({
  LANDING: "landing",
  MAIN: "main",
  FREE_TAROT: "freeTarot",
  REVIEWS: "reviews",
  LEAVE_REVIEW: "leaveReview",
  STUB: "stub",
});

/**
 * Заголовки для экранов-заглушек (экран ещё в разработке)
 */
export const StubTitles = Object.freeze({
  "all-spreads": "Все расклады",
  "card-3days": "Карта дня на 3 дня",
  "fate-matrix": "Матрица судьбы",
  "my-readings": "Мои расклады",
});

/** Ссылка на iRecommend */
export const I_RECOMMEND_URL =
  import.meta.env.VITE_I_RECOMMEND_URL || "https://irecommend.ru";

/** При открытии без params («Открыть приложение», Menu Button) — приветствие. */
export const DEFAULT_SCREEN = ScreenId.LANDING;
export const FALLBACK_SCREEN = ScreenId.MAIN;
