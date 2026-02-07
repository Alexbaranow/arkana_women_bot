import express from "express";
import { validate, parse } from "@tma.js/init-data-node";
import { getAnswer, fetchAscendant, fetchNatalChart } from "./services/ai.js";
import {
  hasFreeQuestion,
  useFreeQuestion,
  createOrder,
  getUserOrders,
} from "./db.js";
import { getProduct, rubToStars } from "./config/products.js";

const app = express();
app.use(express.json({ limit: "10kb" }));

// CORS для мини-приложения (другой origin в dev или Telegram)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

/** Извлечь Telegram user id из initData (для оплаты и заказов) */
function getUserIdFromInitData(initData, res) {
  const token = process.env.BOT_TOKEN;
  if (!token) {
    res.status(500).json({ error: "Сервер не настроен" });
    return null;
  }
  if (!initData) {
    res.status(400).json({ error: "Нужны initData" });
    return null;
  }
  try {
    validate(initData, token);
    const parsed = parse(initData);
    const userId = parsed?.user?.id;
    if (!userId) {
      res.status(401).json({ error: "Пользователь не найден в initData" });
      return null;
    }
    return userId;
  } catch (err) {
    console.error("InitData validation failed:", err?.message);
    res.status(401).json({ error: "Неверные данные приложения" });
    return null;
  }
}

/** POST /api/free-question — бесплатный вопрос из мини-приложения */
app.post("/api/free-question", async (req, res) => {
  const { initData, question } = req.body || {};
  const token = process.env.BOT_TOKEN;

  if (!initData || typeof question !== "string") {
    return res.status(400).json({ error: "Нужны initData и question" });
  }

  if (!token) {
    return res.status(500).json({ error: "Сервер не настроен" });
  }

  let userId;
  try {
    validate(initData, token);
    const parsed = parse(initData);
    userId = parsed?.user?.id;
  } catch (err) {
    console.error("InitData validation failed:", err?.message);
    return res.status(401).json({ error: "Неверные данные приложения" });
  }

  if (!userId) {
    return res.status(401).json({ error: "Пользователь не найден в initData" });
  }

  const text = question.trim();
  if (text.length < 5) {
    return res.status(400).json({ error: "Опиши вопрос чуть подробнее" });
  }

  if (!hasFreeQuestion(userId)) {
    return res.status(403).json({
      error: "Бесплатный вопрос уже использован. Следующий через 3 дня.",
    });
  }

  try {
    const answer = await getAnswer(text);
    useFreeQuestion(userId);
    return res.json({ answer });
  } catch (err) {
    console.error("API free question error:", err);
    return res.status(500).json({
      error: "Не удалось получить ответ. Попробуй позже или короче вопрос.",
    });
  }
});

function validateNatalRequest(req, res) {
  const { initData, dateOfBirth, placeOfBirth, timeOfBirth } = req.body || {};
  const isDev = process.env.NODE_ENV !== "production";

  if (!dateOfBirth || !placeOfBirth) {
    res.status(400).json({ error: "Нужны dateOfBirth и placeOfBirth" });
    return null;
  }
  if (!isDev) {
    const token = process.env.BOT_TOKEN;
    if (!initData || !token) {
      res.status(401).json({
        error: "Нужны initData (открыть из Telegram) и BOT_TOKEN",
      });
      return null;
    }
    try {
      validate(initData, token);
      parse(initData);
    } catch (err) {
      console.error("Natal initData validation failed:", err?.message);
      res.status(401).json({ error: "Неверные данные приложения" });
      return null;
    }
  }
  return {
    dateOfBirth: String(dateOfBirth).trim(),
    placeOfBirth: String(placeOfBirth).trim(),
    timeOfBirth:
      timeOfBirth != null && String(timeOfBirth).trim()
        ? String(timeOfBirth).trim()
        : undefined,
  };
}

/** POST /api/calculate-ascendant — только асцендент */
app.post("/api/calculate-ascendant", async (req, res) => {
  const params = validateNatalRequest(req, res);
  if (!params) return;
  try {
    const ascendant = await fetchAscendant(
      params.dateOfBirth,
      params.placeOfBirth,
      params.timeOfBirth
    );
    return res.json({ ok: true, ascendant });
  } catch (err) {
    console.error("API calculate-ascendant error:", err);
    return res
      .status(500)
      .json({ error: err?.message || "Не удалось рассчитать асцендент." });
  }
});

/** POST /api/calculate-natal-chart — только натальная карта */
app.post("/api/calculate-natal-chart", async (req, res) => {
  const params = validateNatalRequest(req, res);
  if (!params) return;
  try {
    const natalChart = await fetchNatalChart(
      params.dateOfBirth,
      params.placeOfBirth,
      params.timeOfBirth
    );
    return res.json({ ok: true, natalChart });
  } catch (err) {
    console.error("API calculate-natal-chart error:", err);
    return res.status(500).json({
      error: err?.message || "Не удалось рассчитать натальную карту.",
    });
  }
});

// --- Оплата (гибрид: Stars + внешняя) ---

/** POST /api/request-stars-invoice — создать заказ и отправить счёт в чат (Telegram Stars) */
app.post("/api/request-stars-invoice", async (req, res) => {
  const userId = getUserIdFromInitData(req.body?.initData, res);
  if (userId == null) return;

  const productId = req.body?.productId;
  const product = getProduct(productId);
  if (!product) {
    return res.status(400).json({ error: "Неизвестный продукт" });
  }

  const priceStars = rubToStars(product.price_rub);
  const { id: orderId } = createOrder(
    userId,
    product.id,
    "stars",
    product.title,
    product.price_rub,
    priceStars
  );

  const bot = req.app.get("bot");
  if (!bot) {
    return res.status(503).json({
      error:
        "Оплата Stars недоступна: API запущен без бота. Запускайте приложение через node bot.js (бот и API одним процессом).",
    });
  }

  try {
    await bot.api.sendInvoice(userId, {
      title: product.title,
      description: `${product.title} · Результат ${product.delivery_eta}`,
      payload: `order_${orderId}`,
      currency: "XTR",
      prices: [{ label: product.title, amount: priceStars }],
      provider_token: "",
    });
    return res.json({
      ok: true,
      orderId,
      message:
        "В чат с ботом отправлен счёт. Перейди в диалог с ботом и нажми «Оплатить».",
    });
  } catch (err) {
    console.error("sendInvoice error:", err?.message);
    return res.status(500).json({
      error: "Не удалось отправить счёт. Попробуй позже или оплати картой.",
    });
  }
});

/** POST /api/create-external-order — создать заказ: оплата на карту/СБП (реквизиты) или по ссылке */
app.post("/api/create-external-order", async (req, res) => {
  const userId = getUserIdFromInitData(req.body?.initData, res);
  if (userId == null) return;

  const productId = req.body?.productId;
  const product = getProduct(productId);
  if (!product) {
    return res.status(400).json({ error: "Неизвестный продукт" });
  }

  const priceStars = rubToStars(product.price_rub);
  const { id: orderId } = createOrder(
    userId,
    product.id,
    "external",
    product.title,
    product.price_rub,
    priceStars
  );

  const cardDescription = process.env.PAYMENT_CARD_DESCRIPTION || "";
  const sbpPhone = process.env.PAYMENT_SBP_PHONE || "";
  const externalUrl = process.env.EXTERNAL_PAYMENT_URL || "";

  // Оплата переводом на карту / СБП — отдаём реквизиты, без ссылок и посредников
  if (cardDescription.trim() || sbpPhone.trim()) {
    return res.json({
      ok: true,
      orderId,
      amount: product.price_rub,
      productTitle: product.title,
      paymentType: "transfer",
      card: cardDescription.trim() || null,
      sbpPhone: sbpPhone.trim() || null,
      message:
        "Переведи указанную сумму на карту или по СБП. В комментарии укажи номер заказа. После оплаты напиши в чат боту.",
    });
  }

  // Иначе — ссылка на внешнюю страницу оплаты (если настроена)
  const paymentUrl = externalUrl.trim() ? `${externalUrl.trim()}?order_id=${orderId}` : null;
  if (paymentUrl) {
    return res.json({
      ok: true,
      orderId,
      paymentUrl,
      amount: product.price_rub,
      productTitle: product.title,
      paymentType: "link",
      message:
        "После оплаты по ссылке результат придёт в этот чат. Сохрани номер заказа.",
    });
  }

  // Реквизиты и ссылка не настроены — сообщаем администратору
  return res.status(503).json({
    error:
      "Оплата картой/СБП не настроена. Добавьте в .env на сервере PAYMENT_CARD_DESCRIPTION (номер карты) и/или PAYMENT_SBP_PHONE (номер для СБП).",
  });
});

/** POST /api/my-orders — список заказов пользователя */
app.post("/api/my-orders", async (req, res) => {
  const userId = getUserIdFromInitData(req.body?.initData, res);
  if (userId == null) return;

  const list = getUserOrders(userId).map((o) => ({
    id: o.id,
    product_id: o.product_id,
    product_title: o.product_title,
    price_rub: o.price_rub,
    payment_method: o.payment_method,
    status: o.status,
    created_at: o.created_at,
    paid_at: o.paid_at,
  }));

  return res.json({ ok: true, orders: list });
});

export function createApiServer(port = Number(process.env.API_PORT) || 3001, bot = null) {
  if (bot) app.set("bot", bot);
  return app.listen(port, () => {
    console.log(`📡 API слушает порт ${port}`);
  });
}

export default app;
