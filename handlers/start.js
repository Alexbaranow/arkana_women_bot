import { Keyboard, InlineKeyboard } from "grammy";
import { hasFreeQuestion, getUser, needsOnboarding } from "../db.js";
import { startOnboarding } from "./onboarding.js";

const getName = (ctx) => {
  const user = getUser(ctx.from?.id);
  return (
    user?.display_name || ctx.from?.first_name || ctx.from?.username || "друг"
  );
};

// Читаем при вызове, чтобы dotenv уже успел загрузить .env
function getWebAppUrl() {
  return process.env.WEBAPP_URL || "";
}

// Обычные кнопки (Reply keyboard). Если задан WEBAPP_URL — первая кнопка открывает мини-приложение
function getMainKeyboard() {
  const webAppUrl = getWebAppUrl();
  console.log(
    "[start] getMainKeyboard WEBAPP_URL:",
    webAppUrl ? `${webAppUrl.substring(0, 30)}...` : "(пусто)"
  );
  const keyboard = new Keyboard();
  if (webAppUrl) {
    keyboard.webApp("🔮 Открыть приложение", webAppUrl).row();
  }
  keyboard
    .text("⭐ Отзывы клиентов 👀")
    .text("✨ Оставить свой отзыв 🌟")
    .resized();
  return keyboard;
}

// Инлайн-кнопки выбора действия. Если задан WEBAPP_URL — первая кнопка открывает мини-приложение
function getMainInlineKeyboard() {
  const webAppUrl = getWebAppUrl();
  console.log(
    "[start] getMainInlineKeyboard WEBAPP_URL:",
    webAppUrl ? `${webAppUrl.substring(0, 30)}...` : "(пусто)"
  );
  const keyboard = new InlineKeyboard();
  if (webAppUrl) {
    keyboard.webApp("🔮 Открыть приложение", webAppUrl).row();
  }
  return keyboard
    .text("Бесплатный вопрос таро ✨", "main:free_tarot")
    .row()
    .text("Все расклады 📋", "main:all_spreads")
    .row()
    .text("Карта дня на 3 дня (100 ₽) 🪙", "main:card_3days")
    .row()
    .text("Матрица судьбы по дате рождения 🌌", "main:fate_matrix")
    .row()
    .text("Мои расклады / покупки 📂", "main:my_readings");
}

export async function handleStart(ctx) {
  console.log("[start] handleStart, user:", ctx.from?.id);
  if (needsOnboarding(ctx.from.id)) {
    return startOnboarding(ctx);
  }

  const userName = getName(ctx);
  const freeAvailable = hasFreeQuestion(ctx.from.id);

  const text = `Привет, ${userName}! 🔮

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

  await ctx.reply(text, {
    reply_markup: getMainKeyboard(),
  });

  await ctx.reply("Выбери, что хочешь сейчас:", {
    reply_markup: getMainInlineKeyboard(),
  });
}

export { getMainKeyboard, getMainInlineKeyboard };
