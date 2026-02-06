/**
 * Идентификаторы экранов приложения
 */
export const ScreenId = Object.freeze({
  LANDING: "landing",
  MAIN: "main",
  PROFILE: "profile",
  ONBOARDING: "onboarding",
  FREE_TAROT: "freeTarot",
  NUMEROLOGY: "numerology",
  ALL_SPREADS: "all-spreads",
  REVIEWS: "reviews",
  LEAVE_REVIEW: "leaveReview",
  STUB: "stub",
});

/**
 * Заголовки для экранов-заглушек (экран ещё в разработке)
 */
export const StubTitles = Object.freeze({
  "card-day": "Карта дня",
  "card-3days": "Карта дня на 3 дня",
  "three-cards": "Три карты",
  "fate-matrix": "Матрица судьбы",
  "natal-chart": "Натальная карта",
  "heart-present": "Сердце в настоящем",
  "golden-flow": "Золотой поток",
  "body-energy": "Энергия тела",
  "my-readings": "Мои расклады",
});

/** Ссылка на iRecommend */
export const I_RECOMMEND_URL =
  import.meta.env.VITE_I_RECOMMEND_URL || "https://irecommend.ru";

/** При открытии без params («Открыть приложение», Menu Button) — приветствие. */
export const DEFAULT_SCREEN = ScreenId.LANDING;
export const FALLBACK_SCREEN = ScreenId.MAIN;
