/**
 * Каталог платных продуктов (frontend). Держать в синхроне с backend config/products.js.
 * price_stars ≈ price_rub / 2.3
 */

const RUB_TO_STARS = 2.3;

export const PRODUCTS = [
  { id: "card-3days", title: "Карта дня на 3 дня", price_rub: 100, delivery_eta: "в течение 24 часов" },
  { id: "three-cards", title: "Три карты", price_rub: 300, delivery_eta: "через 2 часа" },
  { id: "heart-present", title: "Сердце в настоящем", price_rub: 700, delivery_eta: "через 2 часа" },
  { id: "golden-flow", title: "Золотой поток", price_rub: 700, delivery_eta: "через 2 часа" },
  { id: "body-energy", title: "Энергия тела", price_rub: 700, delivery_eta: "через 2 часа" },
  { id: "fate-matrix", title: "Матрица судьбы", price_rub: 299, delivery_eta: "сразу после оплаты" },
  { id: "natal-chart", title: "Натальная карта", price_rub: 850, delivery_eta: "в течение 24 часов" },
];

export function getProduct(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

export function rubToStars(rub) {
  if (rub == null || rub <= 0) return 0;
  return Math.max(1, Math.ceil(rub / RUB_TO_STARS));
}
