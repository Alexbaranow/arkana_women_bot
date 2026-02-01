import {
  updateDisplayName,
  updateBirthDate,
  getUser,
  needsOnboarding,
} from "../db.js";
import { sendMainMenu } from "./start.js";
// ПРОВЕРИТЬ ПОЗЖЕ/УДАЛИТЬ
/** Валидация даты ДД.ММ.ГГГГ */
function isValidBirthDate(str) {
  if (!str || typeof str !== "string") return false;
  const trimmed = str.trim();
  const match = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!match) return false;
  const [, day, month, year] = match.map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}


const ERR_FORMAT = `Формат: ДД.ММ.ГГГГ 🙈\nНапример: 23.07.1995`;

const ERR_REQUIRED = `Нужна дата в формате ДД.ММ.ГГГГ — без неё расклад будет неточным.\nНапример: 23.07.1995`;

/** Начало онбординга: спросить имя (шаг 1/2). Убираем кнопку «Старт», чтобы не путать с именем */
export async function startOnboarding(ctx) {
  ctx.session.step = "ask_name";

  await ctx.reply(
    "Рада знакомству! 🌸\n\n_Шаг 1 из 2_\n\nКак к тебе обращаться? Напиши имя или как тебя зовут друзья.",
    {
      parse_mode: "Markdown",
      reply_markup: { remove_keyboard: true },
    }
  );
}

/** Обработка шага: ввод имени */
async function handleAskName(ctx, text) {
  const name = text?.trim();
  if (!name || name.length < 2) {
    await ctx.reply(
      "Напиши, пожалуйста, как тебя зовут — хотя бы пару букв 🙂"
    );
    return;
  }
  if (/^старт$/i.test(name)) {
    await ctx.reply(
      "Это кнопка 😊 Напиши, пожалуйста, своё имя — как к тебе обращаться."
    );
    return;
  }

  updateDisplayName(ctx.from.id, name);
  ctx.session.step = "ask_birth_date";

  await ctx.reply(
    `Приятно, ${name}! 💫\n\n_Шаг 2 из 2_\n\nДата рождения нужна для точных раскладов и нумерологии. Напиши в формате ДД.ММ.ГГГГ\nНапример: 05.11.1998`,
    { parse_mode: "Markdown" }
  );
}

/** Обработка шага: ввод даты рождения */
async function handleAskBirthDate(ctx, text) {
  const input = text?.trim();

  if (!input || input.length < 8) {
    await ctx.reply(ERR_REQUIRED);
    return;
  }

  if (!isValidBirthDate(input)) {
    await ctx.reply(ERR_FORMAT);
    return;
  }

  const [, d, m, y] = input.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  const normalized = `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;

  updateBirthDate(ctx.from.id, normalized);
  ctx.session.step = null;

  const user = getUser(ctx.from.id);
  const displayName = user.display_name || user.first_name || "дорогая";

  await ctx.reply(
    `Готово, ${displayName}! ✨ Всё сохранено — теперь карты будут точнее.`
  );

  const freeAvailable =
    !user.last_free_question_at ||
    (Date.now() - new Date(user.last_free_question_at).getTime()) /
      (1000 * 60 * 60 * 24) >=
      3;

  await sendMainMenu(ctx);
}

/** Обработчик сообщений в процессе онбординга */
export async function handleOnboardingMessage(ctx) {
  const step = ctx.session?.step;
  const text = ctx.message?.text;

  if (!step || !text) return false;

  switch (step) {
    case "ask_name":
      await handleAskName(ctx, text);
      return true;
    case "ask_birth_date":
      await handleAskBirthDate(ctx, text);
      return true;
    default:
      return false;
  }
}
