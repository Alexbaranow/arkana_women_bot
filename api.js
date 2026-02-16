import express from "express";
import { validate, parse } from "@tma.js/init-data-node";
import {
  getAnswer,
  fetchAscendant,
  fetchNatalChart,
  getCardOfTheDayContent,
} from "./services/ai.js";
import {
  hasFreeQuestion,
  useFreeQuestion,
  createOrder,
  getUserOrders,
  deleteOrder,
  saveCardOfTheDay,
  getCardOfTheDay,
  deleteCardOfTheDay,
  deleteExpiredCardsOfTheDay,
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

// ========== РЕЖИМ РАЗРАБОТКИ (DEV) ==========
// Подробно: docs/DEV.md
// В dev (NODE_ENV !== "production") можно вызывать API из браузера без Telegram:
// - getUserIdFromInitData возвращает DEV_USER_ID || 1 при отсутствии initData/BOT_TOKEN
// - validateNatalRequest не требует initData для расчёта асцендента/натальной карты
// - в ответах 500 добавляется serverError для отладки
const isDev = process.env.NODE_ENV !== "production";
const DEV_USER_ID =
  Number(process.env.DEV_USER_ID) || Number(process.env.ADMIN_ID) || 0;

const RATE_LIMIT_MESSAGE =
  "Слишком много запросов к звёздам одновременно. Подожди минуту и попробуй снова.";

function isRateLimitError(err) {
  return err?.status === 429 || err?.code === 429;
}

function sendAIError(res, err, defaultMessage) {
  if (isRateLimitError(err)) {
    return res.status(429).json({ error: RATE_LIMIT_MESSAGE });
  }
  console.error("API AI error:", err?.message || err);
  return res.status(500).json({ error: err?.message || defaultMessage });
}

/** Извлечь Telegram user id из initData (для оплаты и заказов).
 *  DEV: при isDev и отсутствии initData или BOT_TOKEN возвращает DEV_USER_ID || 1 (см. docs/DEV.md). */
function getUserIdFromInitData(initData, res) {
  const token = process.env.BOT_TOKEN;
  if (isDev) {
    if (!initData?.trim() || !token) {
      const devId = DEV_USER_ID || 1;
      return devId;
    }
  }
  if (!token) {
    console.error("[API] 500: BOT_TOKEN не задан в .env");
    res.status(500).json({ error: "Сервер не настроен" });
    return null;
  }
  if (!initData?.trim()) {
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
  const { question } = req.body || {};

  if (typeof question !== "string") {
    return res.status(400).json({ error: "Нужны initData и question" });
  }

  const userId = getUserIdFromInitData(req.body?.initData, res);
  if (userId == null) return;

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
    return sendAIError(
      res,
      err,
      "Не удалось получить ответ. Попробуй позже или короче вопрос."
    );
  }
});

function validateNatalRequest(req, res) {
  const { initData, dateOfBirth, placeOfBirth, timeOfBirth } = req.body || {};

  if (!dateOfBirth || !placeOfBirth) {
    res.status(400).json({ error: "Нужны dateOfBirth и placeOfBirth" });
    return null;
  }
  // DEV: в режиме разработки не проверяем initData — можно вызывать из браузера (docs/DEV.md)
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
    return sendAIError(res, err, "Не удалось рассчитать асцендент.");
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
    return sendAIError(res, err, "Не удалось рассчитать натальную карту.");
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
        'Оплата Stars недоступна: API запущен без бота. В Docker используйте CMD ["node", "server-webapp.js"]. Локально — node arkana_women_bot.js или node server-webapp.js.',
    });
  }

  try {
    await bot.api.sendInvoice(
      userId,
      product.title,
      `${product.title} · Результат ${product.delivery_eta}`,
      `order_${orderId}`,
      "XTR",
      [{ label: product.title, amount: priceStars }],
      { provider_token: "" }
    );
    return res.json({
      ok: true,
      orderId,
      message:
        "В чат с ботом отправлен счёт. Перейди в диалог с ботом и нажми «Оплатить».",
    });
  } catch (err) {
    const code = err?.error_code ?? err?.error?.error_code;
    const desc = err?.description ?? err?.error?.description ?? err?.message;
    console.error(
      "sendInvoice error:",
      desc,
      "code:",
      code,
      "full:",
      err?.response?.body ?? err?.payload ?? ""
    );
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
  const paymentUrl = externalUrl.trim()
    ? `${externalUrl.trim()}?order_id=${orderId}`
    : null;
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
    result_text: o.result_text ?? null,
  }));

  return res.json({ ok: true, orders: list });
});

/** POST /api/delete-order — удалить заказ из «Мои заказы» (только свой) */
app.post("/api/delete-order", async (req, res) => {
  const userId = getUserIdFromInitData(req.body?.initData, res);
  if (userId == null) return;

  const orderId = req.body?.orderId != null ? Number(req.body.orderId) : NaN;
  if (Number.isNaN(orderId)) {
    return res.status(400).json({ error: "Нужен orderId" });
  }

  const deleted = deleteOrder(orderId, userId);
  if (!deleted) {
    return res.status(404).json({ error: "Заказ не найден или уже удалён" });
  }
  return res.json({ ok: true });
});

// --- Карта дня (бесплатная, до 24:00 по Москве) ---

/** POST /api/card-of-the-day — запросить карту дня (генерация в фоне, ответ сразу) */
app.post("/api/card-of-the-day", async (req, res) => {
  const userId = getUserIdFromInitData(req.body?.initData, res);
  if (userId == null) return;

  const ascendant = req.body?.ascendant;
  const natalChart = req.body?.natalChart;
  const hasNatal =
    (ascendant && (ascendant.sign || ascendant.description)) ||
    (natalChart && String(natalChart).trim());

  if (!hasNatal) {
    return res.status(400).json({
      error:
        "Для более точной карты дня сначала рассчитай асцендент и натальную карту в личном кабинете (раздел «Асцендент и натальная карта»).",
      code: "NEED_NATAL",
    });
  }

  try {
    const text = await getCardOfTheDayContent({
      userName: req.body?.userName?.trim() || null,
      ascendant:
        ascendant && (ascendant.sign || ascendant.description)
          ? {
              sign: ascendant.sign || "",
              description: ascendant.description || "",
            }
          : null,
      natalChart: natalChart && String(natalChart).trim() ? natalChart : null,
      tarotCardName: req.body?.tarotCardName?.trim() || null,
    });
    const entry = saveCardOfTheDay(userId, text);
    deleteExpiredCardsOfTheDay();
    return res.json({
      ok: true,
      text: entry.text,
      expiresAt: entry.expires_at,
      dateKey: entry.date_key,
    });
  } catch (err) {
    if (isRateLimitError(err)) {
      return res.status(429).json({ error: RATE_LIMIT_MESSAGE });
    }
    console.error("[API] card-of-the-day error:", err?.message, err?.stack);
    const payload = {
      error:
        err?.message || "Не удалось сгенерировать карту дня. Попробуй позже.",
    };
    if (isDev) payload.serverError = err?.message || String(err); // DEV: отладка (docs/DEV.md)
    return res.status(500).json(payload);
  }
});

/** POST /api/card-of-the-day/clear — удалить карту дня (для сброса профиля) */
app.post("/api/card-of-the-day/clear", async (req, res) => {
  const userId = getUserIdFromInitData(req.body?.initData, res);
  if (userId == null) return;
  deleteCardOfTheDay(userId);
  return res.json({ ok: true });
});

/** POST /api/card-of-the-day/get — получить текущую карту дня пользователя */
app.post("/api/card-of-the-day/get", async (req, res, next) => {
  if (isDev)
    console.log(
      "[API] card-of-the-day/get запрос, initData есть:",
      !!req.body?.initData?.trim()
    ); // DEV: отладка (docs/DEV.md)
  try {
    const userId = getUserIdFromInitData(req.body?.initData, res);
    if (userId == null) return;

    deleteExpiredCardsOfTheDay();
    const entry = getCardOfTheDay(userId);
    if (!entry) {
      return res.json({ ok: true, card: null });
    }
    return res.json({
      ok: true,
      card: {
        text: entry.text,
        expiresAt: entry.expires_at,
        dateKey: entry.date_key,
      },
    });
  } catch (err) {
    console.error("[API] card-of-the-day/get error:", err?.message, err?.stack);
    if (!res.headersSent) {
      return res.status(500).json({
        error: "Не удалось загрузить карту дня. Попробуй позже.",
        ...(isDev && { serverError: err?.message }), // DEV: отладка (docs/DEV.md)
      });
    }
    next(err);
  }
});

// Всегда отдаём JSON при любой необработанной ошибке
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  console.error("[API] Необработанная ошибка:", err?.message, err?.stack);
  res.status(500).json({
    error: err?.message || "Внутренняя ошибка сервера",
    ...(isDev && { serverError: String(err) }), // DEV: отладка (docs/DEV.md)
  });
});

export function createApiServer(
  port = Number(process.env.API_PORT) || 3001,
  bot = null
) {
  if (bot) app.set("bot", bot);
  if (!process.env.BOT_TOKEN) {
    console.warn(
      "⚠️ BOT_TOKEN не задан — запросы карты дня, оплаты и заказов будут возвращать 500."
    );
  }
  if (!process.env.OPENAI_API_KEY && !process.env.BOTHUB_API_KEY) {
    console.warn(
      "⚠️ OPENAI_API_KEY или BOTHUB_API_KEY не задан — карта дня, асцендент и натальная карта будут возвращать 500."
    );
  }
  return app.listen(port, () => {
    console.log(`📡 API слушает порт ${port}`);
  });
}

export default app;
