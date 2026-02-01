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
