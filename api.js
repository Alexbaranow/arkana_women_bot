import express from "express";
import { validate, parse } from "@tma.js/init-data-node";
import { getAnswer, fetchAscendant, fetchNatalChart } from "./services/ai.js";
import { hasFreeQuestion, useFreeQuestion } from "./db.js";

const app = express();
app.use(express.json({ limit: "10kb" }));

// CORS для мини-приложения (другой origin в dev или Telegram)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

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
  const { initData, dateOfBirth, placeOfBirth } = req.body || {};
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
  };
}

/** POST /api/calculate-ascendant — только асцендент */
app.post("/api/calculate-ascendant", async (req, res) => {
  const params = validateNatalRequest(req, res);
  if (!params) return;
  try {
    const ascendant = await fetchAscendant(
      params.dateOfBirth,
      params.placeOfBirth
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
      params.placeOfBirth
    );
    return res.json({ ok: true, natalChart });
  } catch (err) {
    console.error("API calculate-natal-chart error:", err);
    return res
      .status(500)
      .json({
        error: err?.message || "Не удалось рассчитать натальную карту.",
      });
  }
});

export function createApiServer(port = Number(process.env.API_PORT) || 3001) {
  return app.listen(port, () => {
    console.log(`📡 API слушает порт ${port}`);
  });
}

export default app;
