import { InlineKeyboard } from "grammy";
import { needsOnboarding } from "../db.js";
import { startOnboarding } from "./onboarding.js";

function getWebAppUrl() {
  return process.env.WEBAPP_URL || "";
}

const GREETING_TEXT = `Привет 💜

Я тут помогаю разбираться с тем, что обычно крутится в голове: отношения, деньги, здоровье, своё дело — куда двигаться и на что опереться.

Карты и расклады не дают готовых ответов, но помогают посмотреть на ситуацию по-другому. У тебя есть один бесплатный вопрос — обновляется раз в 3 дня. Если хочешь, можешь задать его прямо сейчас 👇`;

/** URL приложения, опционально с экраном. Только query — hash перезаписывается Telegram своими launch params. */
function getWebAppUrlWithScreen(screen) {
  const base = getWebAppUrl();
  if (!base) return "";
  if (!screen) return base;
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}screen=${encodeURIComponent(screen)}`;
}

/** Инлайн-кнопка открытия приложения (initData передаётся только при открытии через неё) */
function getOpenAppInlineKeyboard() {
  const url = getWebAppUrlWithScreen();
  if (!url) return undefined;
  return new InlineKeyboard().webApp("🔮 Открыть приложение", url);
}

/** Инлайн-кнопка «Открыть» для перехода в приложение на нужный экран */
function getAppInlineKeyboardForScreen(screen) {
  const url = getWebAppUrlWithScreen(screen);
  if (!url) return undefined;
  return new InlineKeyboard().webApp("Открыть приложение", url);
}

/** Главное меню — все пункты инлайн (Web App) */
function getMainMenuInlineKeyboard() {
  const base = getWebAppUrl();
  const kb = new InlineKeyboard();
  if (base) {
    kb.webApp("🔮 Открыть приложение", base)
      .row()
      .webApp("Бесплатный вопрос таро ✨", getWebAppUrlWithScreen("freeTarot"))
      .row()
      .webApp("Все расклады 📋", getWebAppUrlWithScreen("all-spreads"))
      .row()
      .webApp(
        "Карта дня на 3 дня (100 ₽) 🪙",
        getWebAppUrlWithScreen("card-3days")
      )
      .row()
      .webApp(
        "Матрица судьбы/натальная карта 🌌",
        getWebAppUrlWithScreen("fate-matrix")
      )
      .row()
      .webApp("Мои расклады 📂", getWebAppUrlWithScreen("my-readings"));
  }
  return kb;
}

/** Показать приветствие и главное меню (инлайн-кнопки) */
async function sendMainMenu(ctx) {
  await ctx.reply(GREETING_TEXT, {
    reply_markup: getMainMenuInlineKeyboard(),
  });
}

/** /start — сразу приветствие и меню (без экрана «Что умеет» и кнопки «Старт») */
export async function handleStart(ctx) {
  if (!ctx.from) return;
  console.log("[start] /start от", ctx.from.id);
  await sendMainMenu(ctx);
}

/** Нажатие кнопки «Старт» (для обратной совместимости) — онбординг или главное меню */
export async function handleStartButton(ctx) {
  if (needsOnboarding(ctx.from.id)) {
    return startOnboarding(ctx);
  }
  await sendMainMenu(ctx);
}

const WELCOME = () => GREETING_TEXT;

const HELP_TEXT = `*Помощь* ❓

Всё самое важное — в приложении. Нажми кнопку ниже, чтобы открыть его.

Там ты сможешь:
• Задать бесплатный вопрос картам (раз в 3 дня)
• Посмотреть расклады и цены
• Почитать отзывы и оставить свой

Если что-то не работает — напиши сюда, отвечу. 💜`;

export async function handleHelp(ctx) {
  const keyboard = getOpenAppInlineKeyboard();
  await ctx.reply(HELP_TEXT, {
    parse_mode: "Markdown",
    ...(keyboard && { reply_markup: keyboard }),
  });
}

/** Любое сообщение (не команда) — показать главное меню */
export async function handlePromptToStart(ctx) {
  await sendMainMenu(ctx);
}

export {
  getOpenAppInlineKeyboard,
  getAppInlineKeyboardForScreen,
  getMainMenuInlineKeyboard,
  sendMainMenu,
  WELCOME,
};
