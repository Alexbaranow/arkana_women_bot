import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

import { Bot, session } from "grammy";
import { createUser } from "./db.js";
import {
  handleStart,
  handleStartButton,
  handleHelp,
  handlePromptToStart,
  sendMainMenu,
} from "./handlers/start.js";
import { needsOnboarding } from "./db.js";
import { startOnboarding } from "./handlers/onboarding.js";
import { handleMainCallback } from "./handlers/main.js";
import { handleOnboardingMessage } from "./handlers/onboarding.js";
import { handleFreeQuestionMessage } from "./handlers/freeQuestion.js";
import {
  handlePreCheckout,
  handleSuccessfulPayment,
} from "./handlers/payments.js";
import { createApiServer } from "./api.js";

const bot = new Bot(process.env.BOT_TOKEN);

// Меню команд (отображается при нажатии на / в чате)
async function setupCommands() {
  await bot.api.setMyCommands([
    { command: "start", description: "Начать · Главное меню" },
    { command: "help", description: "Помощь · Как пользоваться" },
    // Доработать!
  ]);
}

bot.use(
  session({
    initial: () => ({
      step: null,
      data: {},
    }),
  })
);

bot.use(async (ctx, next) => {
  try {
    if (ctx.from) {
      createUser(
        ctx.from.id,
        ctx.from.username,
        ctx.from.first_name,
        ctx.from.last_name
      );
    }
  } catch (e) {
    console.warn("[bot] createUser:", e?.message);
  }
  await next();
});

// === Команды ===
bot.command("start", async (ctx) => {
  try {
    await handleStart(ctx);
  } catch (err) {
    console.error("[start] Error:", err);
    await ctx.reply("Что-то пошло не так. Попробуй ещё раз или напиши /start.");
  }
});
bot.command("help", handleHelp);

// === Бесплатный вопрос к нейросети (ожидание текста вопроса) ===
// === Онбординг: перехват сообщений при сборе данных ===
bot.on("message:text", async (ctx, next) => {
  if (ctx.session?.step === "free_question_waiting") {
    const handled = await handleFreeQuestionMessage(ctx);
    if (handled) return;
  }
  if (ctx.session?.step) {
    const handled = await handleOnboardingMessage(ctx);
    if (handled) return;
  }
  await next();
});

// === Кнопка «Старт» (обратная совместимость) ===
bot.hears("🔮 Старт", handleStartButton);
bot.hears("Старт", handleStartButton);

// === Оплата (Telegram Stars) ===
bot.on("pre_checkout_query", handlePreCheckout);
bot.on("message:successful_payment", handleSuccessfulPayment);

// === Инлайн-кнопки главного меню ===
bot.callbackQuery(/^main:/, handleMainCallback);

// === Любое текстовое сообщение (не команда) → показать главное меню ===
// Фильтр: только если текст не начинается с "/" (иначе /start уже обработан выше и будет дубль).
// Например: пользователь написал "привет" или "что умеешь" — бот отвечает приветствием и инлайн-меню.
bot
  .filter((ctx) => {
    const text = ctx.message?.text?.trim() ?? "";
    return !text.startsWith("/");
  })
  .on("message:text", handlePromptToStart);

// === Обработка ошибок ===
bot.catch((err) => {
  console.error("Bot error:", err);
});

const API_PORT = Number(process.env.API_PORT) || 3001;

console.log("🔮 Arkana Bot запускается...");
console.log(
  "[bot] WEBAPP_URL при старте:",
  process.env.WEBAPP_URL ? process.env.WEBAPP_URL : "(не задан)"
);

createApiServer(API_PORT, bot);

(async () => {
  try {
    await setupCommands();
  } catch (e) {
    console.warn("[bot] setMyCommands failed:", e?.message);
  }
  await bot.start();
})();
