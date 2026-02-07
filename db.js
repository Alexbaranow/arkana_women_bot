/**
 * In-memory хранилище (без БД)
 * Данные теряются при перезапуске бота
 */

const users = new Map();
const reviews = [];
const orders = [];
const tarotReadings = [];
const cardOfTheDayStore = [];
let orderId = 1;

/** Текущая дата по Москве (YYYY-MM-DD) для карты дня */
function getMoscowDateKey() {
  const now = new Date();
  const moscow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Moscow" }));
  return moscow.toISOString().slice(0, 10);
}

/** Конец текущего дня по Москве (ISO) — после этого карта дня считается истёкшей */
function getMoscowEndOfToday() {
  const key = getMoscowDateKey();
  return `${key}T23:59:59.999+03:00`;
}

// === Карта дня (бесплатная, до 24:00 по Москве) ===

export function saveCardOfTheDay(userId, text) {
  const dateKey = getMoscowDateKey();
  const expiresAt = getMoscowEndOfToday();
  const existing = cardOfTheDayStore.find(
    (c) => c.user_id === userId && c.date_key === dateKey
  );
  if (existing) {
    existing.text = text;
    existing.expires_at = expiresAt;
    return existing;
  }
  const entry = {
    user_id: userId,
    date_key: dateKey,
    text,
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  };
  cardOfTheDayStore.push(entry);
  return entry;
}

export function getCardOfTheDay(userId) {
  const dateKey = getMoscowDateKey();
  const now = new Date();
  const entry = cardOfTheDayStore.find(
    (c) => c.user_id === userId && c.date_key === dateKey
  );
  if (!entry) return null;
  const expiresAt = new Date(entry.expires_at);
  if (now > expiresAt) return null;
  return entry;
}

/** Удалить карту дня пользователя (для сброса профиля) */
export function deleteCardOfTheDay(userId) {
  const dateKey = getMoscowDateKey();
  for (let i = cardOfTheDayStore.length - 1; i >= 0; i--) {
    if (cardOfTheDayStore[i].user_id === userId && cardOfTheDayStore[i].date_key === dateKey) {
      cardOfTheDayStore.splice(i, 1);
      return true;
    }
  }
  return false;
}

/** Удалить истёкшие карты дня (можно вызывать периодически) */
export function deleteExpiredCardsOfTheDay() {
  const now = new Date();
  for (let i = cardOfTheDayStore.length - 1; i >= 0; i--) {
    if (new Date(cardOfTheDayStore[i].expires_at) <= now) {
      cardOfTheDayStore.splice(i, 1);
    }
  }
}

// === Пользователи ===

export function getUser(telegramId) {
  return users.get(telegramId) || null;
}

export function createUser(telegramId, username, firstName, lastName) {
  let user = users.get(telegramId);
  if (!user) {
    user = {
      telegram_id: telegramId,
      username,
      first_name: firstName,
      last_name: lastName,
      balance: 0,
      display_name: null,
      birth_date: null,
      last_free_question_at: null,
      created_at: new Date().toISOString(),
    };
    users.set(telegramId, user);
  } else {
    user.username = username;
    user.first_name = firstName;
    user.last_name = lastName;
  }
  return user;
}

export function updateDisplayName(telegramId, displayName) {
  const user = users.get(telegramId);
  if (user) user.display_name = displayName?.trim() || null;
}

export function updateBirthDate(telegramId, birthDate) {
  const user = users.get(telegramId);
  if (user) user.birth_date = birthDate || null;
}

export function needsOnboarding(telegramId) {
  const user = getUser(telegramId);
  const hasName =
    user?.display_name && String(user.display_name).trim().length >= 2;
  const hasDate = user?.birth_date && String(user.birth_date).trim().length > 0;
  return !hasName || !hasDate;
}

export function updateUserBalance(telegramId, amount) {
  const user = users.get(telegramId);
  if (user) user.balance = (user.balance || 0) + amount;
}

// === Бесплатный вопрос (каждые 3 дня) ===

const FREE_QUESTION_DAYS = 3;

export function hasFreeQuestion(telegramId) {
  const user = getUser(telegramId);
  if (!user?.last_free_question_at) return true;
  const lastUsed = new Date(user.last_free_question_at);
  const daysDiff = (Date.now() - lastUsed) / (1000 * 60 * 60 * 24);
  return daysDiff >= FREE_QUESTION_DAYS;
}

export function useFreeQuestion(telegramId) {
  const user = users.get(telegramId);
  if (user) user.last_free_question_at = new Date().toISOString();
}

// === Расклады ===

export function saveTarotReading(userId, spreadType, cards, interpretation) {
  tarotReadings.push({
    user_id: userId,
    spread_type: spreadType,
    cards,
    interpretation,
    created_at: new Date().toISOString(),
  });
}

export function getUserReadings(userId, limit = 10) {
  return tarotReadings
    .filter((r) => r.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}

// === Заказы ===

/** Создать заказ. payment_method: "stars" | "external" */
export function createOrder(userId, productId, paymentMethod, productTitle, priceRub, priceStars) {
  const id = orderId++;
  const order = {
    id,
    user_id: userId,
    product_id: productId,
    product_title: productTitle,
    price_rub: priceRub,
    price_stars: priceStars,
    payment_method: paymentMethod,
    status: "pending",
    telegram_payment_charge_id: null,
    created_at: new Date().toISOString(),
    paid_at: null,
  };
  orders.push(order);
  return { id };
}

export function getOrder(orderId) {
  const id = Number(orderId);
  return orders.find((o) => o.id === id) || null;
}

export function getOrderByPayload(invoicePayload) {
  const id = Number(String(invoicePayload).replace(/^order_/, ""));
  return Number.isNaN(id) ? null : getOrder(id);
}

export function getUserOrders(userId) {
  return orders
    .filter((o) => o.user_id === userId)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function updateOrderPaid(orderId, telegramPaymentChargeId = null) {
  const order = getOrder(orderId);
  if (!order) return false;
  order.status = "paid";
  order.paid_at = new Date().toISOString();
  if (telegramPaymentChargeId != null) order.telegram_payment_charge_id = telegramPaymentChargeId;
  return true;
}

export function updateOrderStatus(orderId, status) {
  const order = getOrder(orderId);
  if (!order) return false;
  order.status = status;
  return true;
}

/** Удалить заказ; только если он принадлежит пользователю */
export function deleteOrder(orderId, userId) {
  const id = Number(orderId);
  const idx = orders.findIndex((o) => o.id === id && o.user_id === userId);
  if (idx === -1) return false;
  orders.splice(idx, 1);
  return true;
}

// === Отзывы ===

export function getVisibleReviews(limit = 10) {
  return reviews
    .filter((r) => r.is_visible !== false)
    .slice(0, limit)
    .map((r) => ({ ...r, first_name: "Клиент" }));
}

export function createReview(userId, rating, text) {
  reviews.push({ user_id: userId, rating, text, is_visible: true });
}

// === Статистика ===

export function getStats() {
  return {
    totalUsers: users.size,
    totalReadings: tarotReadings.length,
    totalOrders: orders.length,
  };
}

// Для admin.js (если понадобится)
export default {
  prepare: (sql) => ({
    run: () => {},
    get: () => ({ count: 0 }),
    all: () => [],
  }),
};
