/**
 * In-memory хранилище (без БД)
 * Данные теряются при перезапуске бота
 */

const users = new Map();
const reviews = [];
const orders = [];
const tarotReadings = [];
let orderId = 1;

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
