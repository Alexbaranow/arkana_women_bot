import OpenAI from "openai";

let openaiClient = null;

function getOpenAI() {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY не задан в .env");
    }
    const options = { apiKey: process.env.OPENAI_API_KEY };
    // Прокси
    if (process.env.OPENAI_BASE_URL) {
      options.baseURL = process.env.OPENAI_BASE_URL.replace(/\/$/, "");
    }
    openaiClient = new OpenAI(options);
  }
  return openaiClient;
}

const SYSTEM_PROMPT = `Ты — мудрый и добрый помощник в стиле таро и интуитивных практик. Отвечай кратко (2–4 абзаца), по-русски, тёплым и поддерживающим тоном. Не обещай точных предсказаний, но давай вдохновляющие подсказки и размышления. Не используй списки и буллеты, пиши сплошным текстом.`;

/**
 * Отправляет вопрос пользователя в нейросеть и возвращает ответ.
 * @param {string} userQuestion - текст вопроса
 * @returns {Promise<string>} ответ нейросети
 */
export async function getAnswer(userQuestion) {
  const openai = getOpenAI();
  // Модель: по умолчанию OpenAI. Для Open Router: tngtech/deepseek-r1t2-chimera:free и др.
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userQuestion.trim() },
    ],
    max_tokens: 500,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Пустой ответ от нейросети");
  }
  return content.trim();
}

const ASCENDANT_PROMPT = `Ты — астролог и специалист по Таро. По дате, времени (если указано) и месту рождения рассчитай символический асцендент. Если в запросе есть время рождения — обязательно используй его для более точного расчёта асцендента. Ответь ТОЛЬКО валидным JSON с полями: "sign" (знак асцендента, например "Стрелец"), "description" (2–4 предложения о значении асцендента в контексте Таро, связь с арканами). Без вступления, только JSON.`;

const NATAL_CHART_PROMPT = `Ты — астролог и специалист по Таро. По дате, времени (если указано) и месту рождения опиши натальную карту: 2–3 абзаца текста о ключевых арканах, энергиях и темах жизни. Если в запросе есть время рождения — используй его для более точной натальной карты. По-русски, тёплым тоном. Только текст, без JSON и вступлений.`;

function extractTextFromChoice(choice) {
  const msg = choice?.message;
  if (!msg) return "";
  const c = msg.content;
  if (typeof c === "string") return c.trim();
  if (Array.isArray(c)) {
    const text = c.find((p) => p?.type === "text")?.text;
    return typeof text === "string" ? text.trim() : "";
  }
  return "";
}

/**
 * Парсит ответ нейросети в объект ascendant { sign, description }
 */
export async function fetchAscendant(
  dateOfBirth,
  placeOfBirth,
  timeOfBirth,
  retry = false
) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const timePart = timeOfBirth ? ` Время рождения: ${timeOfBirth}.` : "";
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: ASCENDANT_PROMPT },
      {
        role: "user",
        content: `Дата рождения: ${dateOfBirth}. Место рождения: ${placeOfBirth}.${timePart}`,
      },
    ],
    max_tokens: 800,
  });
  const choice = completion.choices[0];
  let content = extractTextFromChoice(choice);
  if (!content && !retry) {
    await new Promise((r) => setTimeout(r, 1000));
    return fetchAscendant(dateOfBirth, placeOfBirth, timeOfBirth, true);
  }
  if (!content) {
    const reason = choice?.finish_reason || "unknown";
    console.warn("[ai] ascendant empty:", {
      finish_reason: reason,
      hasMessage: !!choice?.message,
      contentType: typeof choice?.message?.content,
    });
    throw new Error(
      `Пустой ответ от нейросети (асцендент). finish_reason: ${reason}`
    );
  }

  let raw = content
    .replace(/^```(?:json)?\s*\n?/i, "")
    .replace(/\n?```\s*$/, "")
    .trim();
  const start = raw.indexOf("{");
  if (start > 0) raw = raw.slice(start);
  const end = raw.lastIndexOf("}");
  if (end !== -1 && end < raw.length - 1) raw = raw.slice(0, end + 1);

  try {
    const parsed = JSON.parse(raw.replace(/,(\s*[}\]])/g, "$1"));
    const sign = String(parsed?.sign ?? "").trim();
    const description = String(parsed?.description ?? "").trim();
    return { sign, description };
  } catch {
    const signMatch = raw.match(/"sign"\s*:\s*"([^"]*)"/);
    const descMatch = raw.match(/"description"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    const sign = signMatch ? signMatch[1].replace(/\\"/g, '"').trim() : "";
    const description = descMatch
      ? descMatch[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").trim()
      : "";
    if (sign || description) return { sign, description };
    throw new Error("Нейросеть вернула некорректный JSON (асцендент)");
  }
}

/**
 * Запрашивает текст натальной карты
 */
export async function fetchNatalChart(
  dateOfBirth,
  placeOfBirth,
  timeOfBirth,
  retry = false
) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const timePart = timeOfBirth ? ` Время рождения: ${timeOfBirth}.` : "";
  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: NATAL_CHART_PROMPT },
      {
        role: "user",
        content: `Дата рождения: ${dateOfBirth}. Место рождения: ${placeOfBirth}.${timePart}`,
      },
    ],
    max_tokens: 4096,
  });
  const choice = completion.choices[0];
  let content = extractTextFromChoice(choice);
  if (!content && !retry) {
    await new Promise((r) => setTimeout(r, 1000));
    return fetchNatalChart(dateOfBirth, placeOfBirth, timeOfBirth, true);
  }
  if (!content) {
    const reason = choice?.finish_reason || "unknown";
    console.warn("[ai] natalChart empty:", { finish_reason: reason });
    throw new Error(
      `Пустой ответ от нейросети (натальная карта). finish_reason: ${reason}`
    );
  }
  return content;
}

/**
 * Запрашивает асцендент и натальную карту — два параллельных запроса.
 * @param {string} dateOfBirth - дата рождения (YYYY-MM-DD)
 * @param {string} placeOfBirth - место рождения (город или страна)
 * @returns {Promise<{ ascendant: { sign, description }, natalChart: string }>}
 */
export async function getAscendantAndNatalChart(
  dateOfBirth,
  placeOfBirth,
  timeOfBirth
) {
  const [ascendant, natalChart] = await Promise.all([
    fetchAscendant(dateOfBirth, placeOfBirth, timeOfBirth),
    fetchNatalChart(dateOfBirth, placeOfBirth, timeOfBirth),
  ]);
  return {
    ascendant,
    natalChart,
  };
}
