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

const NATAL_SYSTEM_PROMPT = `Ты — астролог и специалист по Таро. По дате и месту рождения рассчитай символический асцендент и кратко опиши натальную карту в контексте Таро (арканы, энергии). Ответь структурированно, по-русски, в формате JSON с полями: "ascendant" (знак асцендента и краткое описание), "natalChart" (2–3 абзаца текста о натальной карте и связи с арканами). Без лишнего вступления, только валидный JSON.`;

/**
 * Запрашивает у нейросети расчёт асцендента и натальной карты по дате и месту рождения.
 * @param {string} dateOfBirth - дата рождения (YYYY-MM-DD)
 * @param {string} placeOfBirth - место рождения (город или страна)
 * @returns {Promise<{ ascendant: string, natalChart: string }>}
 */
export async function getAscendantAndNatalChart(dateOfBirth, placeOfBirth) {
  const openai = getOpenAI();
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: NATAL_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Дата рождения: ${dateOfBirth}. Место рождения: ${placeOfBirth}.`,
      },
    ],
    max_tokens: 800,
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Пустой ответ от нейросети");
  }

  try {
    const parsed = JSON.parse(content.trim());
    return {
      ascendant: parsed.ascendant ?? "",
      natalChart: parsed.natalChart ?? "",
    };
  } catch {
    return {
      ascendant: content.slice(0, 200),
      natalChart: content,
    };
  }
}
