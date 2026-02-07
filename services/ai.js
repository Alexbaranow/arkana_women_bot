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

const CARD_OF_THE_DAY_SYSTEM = `Ты — мудрый таролог и интуитивный помощник. Твоя задача: дать персональную "карту дня" — один день, одна карта Таро как тема и совет на сегодня.

Правила:
- Учитывай асцендент и натальную карту человека: они задают фон и сильные архетипы.
- Если указана "ключевая карта Таро" по натальной карте — свяжи её с темой дня: как энергия этой карты может проявиться сегодня.
- Обращайся по имени, если оно указано — тёпло и лично.
- Ответ: 2–4 абзаца сплошным текстом, по-русски. Без списков и буллетов.
- Тон: поддерживающий, вдохновляющий, без пустых предсказаний. Конкретные подсказки: на что обратить внимание, какую энергию пригласить, что отпустить.
- Не повторяй дословно натальную карту — используй её как основу для сегодняшнего фокуса.`;

/**
 * Генерирует текст "карты дня" с учётом асцендента, имени и натальной карты (и опционально ключевой карты Таро).
 * @param {object} opts - { userName?, ascendant: { sign, description }, natalChart?, tarotCardName? }
 * @returns {Promise<string>}
 */
export async function getCardOfTheDayContent(opts, retry = false) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const { userName, ascendant, natalChart, tarotCardName } = opts;

  const parts = [];
  if (userName && String(userName).trim()) {
    parts.push(`Имя: ${String(userName).trim()}.`);
  }
  if (ascendant?.sign || ascendant?.description) {
    const desc = String(ascendant.description || "").slice(0, 500);
    parts.push(
      `Асцендент: ${ascendant.sign || ""} — ${desc}.`
    );
  }
  if (natalChart && String(natalChart).trim()) {
    const excerpt =
      String(natalChart).length > 1200
        ? String(natalChart).trim().slice(0, 1200) + "..."
        : String(natalChart).trim();
    parts.push(`Натальная карта (выдержка): ${excerpt}`);
  }
  if (tarotCardName && String(tarotCardName).trim()) {
    parts.push(
      `Ключевая карта Таро по натальной карте: ${String(tarotCardName).trim()}. Увяжи её энергию с темой дня.`
    );
  }
  const userContext =
    parts.length > 0
      ? parts.join("\n\n")
      : "Данных нет — дай общую поддерживающую карту дня.";

  const userMessage = `Сегодняшний день. Контекст человека:\n\n${userContext}\n\nДай персональную карту дня: одна карта Таро как тема и совет на сегодня.`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: CARD_OF_THE_DAY_SYSTEM },
      { role: "user", content: userMessage },
    ],
    max_tokens: 1200,
  });

  const choice = completion.choices[0];
  const content = extractTextFromChoice(choice);
  if (!content && !retry) {
    await new Promise((r) => setTimeout(r, 1500));
    return getCardOfTheDayContent(opts, true);
  }
  if (!content) {
    const reason = choice?.finish_reason || "unknown";
    console.warn("[ai] card-of-the-day empty:", { finish_reason: reason });
    throw new Error(
      `Пустой ответ от нейросети (карта дня). finish_reason: ${reason}`
    );
  }
  return content.trim();
}
