import {
  updateDisplayName,
  updateBirthDate,
  getUser,
  needsOnboarding,
} from "../db.js";
import { getMainKeyboard, getMainInlineKeyboard } from "./start.js";

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

const ERR_FORMAT = `Кажется, формат немного не тот 🙈

Напиши, пожалуйста, так: ДД.ММ.ГГГГ
Например: 23.07.1995`;

const ERR_REQUIRED = `Прости, но без твоей даты рождения и реального имени не получится точный прогноз😕

Напиши, пожалуйста, так: ДД.ММ.ГГГГ
Например: 23.07.1995`;

/** Начало онбординга: спросить имя */
export async function startOnboarding(ctx) {
  ctx.session.step = "ask_name";

  await ctx.reply("Давай познакомимся 🌻\n\nНапиши, как к тебе обращаться?");
}

/** Обработка шага: ввод имени */
async function handleAskName(ctx, text) {
  const name = text?.trim();
  if (!name || name.length < 2) {
    await ctx.reply(
      "Прости, напиши, пожалуйста, как тебя зовут? Хоть пару букв 🙂"
    );
    return;
  }

  updateDisplayName(ctx.from.id, name);
  ctx.session.step = "ask_birth_date";

  await ctx.reply(
    `Рад знакомству, ${name} 💫\n\nТеперь укажи свою дату рождения в формате ДД.ММ.ГГГГ\nПример: 05.11.1998`
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
  const displayName = user.display_name || user.first_name || "друг";

  await ctx.reply(`Отлично, ${displayName}! Все данные сохранены ✨`);

  // Показываем главное меню
  const freeAvailable =
    !user.last_free_question_at ||
    (Date.now() - new Date(user.last_free_question_at).getTime()) /
      (1000 * 60 * 60 * 24) >=
      3;

  const welcomeText = `Привет, ${displayName}! 🔮

Я твой личный помощник по Таро и нумерологии ✨

Реальный таролог (не ИИ!) заглянет в твоё будущее через карты и дату рождения.

Заглянем в будущее через карты и твою дату рождения?

Помогу с любовью ❤️, деньгами 💰, здоровьем 💚, предназначением 🌙

У тебя ${
    freeAvailable
      ? "есть 1 бесплатный вопрос"
      : "бесплатный вопрос скоро обновится"
  }, он обновляется каждые 3 дня — начнём?

Выбери, что хочешь сейчас:`;

  await ctx.reply(welcomeText, {
    reply_markup: getMainKeyboard(),
  });

  await ctx.reply("Выбери, что хочешь сейчас:", {
    reply_markup: getMainInlineKeyboard(),
  });
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
