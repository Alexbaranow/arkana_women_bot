/**
 * Общий экземпляр бота для dev (arkana_women_bot.js) и prod (server-webapp.js).
 * Экспортирует настроенного бота и setupCommands.
 */
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
  getAppInlineKeyboardForScreen,
} from "./handlers/start.js";
import { startOnboarding } from "./handlers/onboarding.js";
import { handleMainCallback } from "./handlers/main.js";
import { handleOnboardingMessage } from "./handlers/onboarding.js";
import { handleFreeQuestionMessage } from "./handlers/freeQuestion.js";
import {
  handlePreCheckout,
  handleSuccessfulPayment,
} from "./handlers/payments.js";

const bot = new Bot(process.env.BOT_TOKEN);

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
  } catch {}
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

/** Команды меню — открывают приложение на нужном экране */
bot.command("app", async (ctx) => {
  const kb = getAppInlineKeyboardForScreen();
  await ctx.reply("🔮 Открыть приложение", {
    reply_markup: kb ?? undefined,
  });
});
bot.command("free", async (ctx) => {
  const kb = getAppInlineKeyboardForScreen("freeTarot");
  await ctx.reply("✨ Бесплатный вопрос таро", {
    reply_markup: kb ?? undefined,
  });
});
bot.command("spreads", async (ctx) => {
  const kb = getAppInlineKeyboardForScreen("all-spreads");
  await ctx.reply("📋 Все расклады", {
    reply_markup: kb ?? undefined,
  });
});
bot.command("card3", async (ctx) => {
  const kb = getAppInlineKeyboardForScreen("card-3days");
  await ctx.reply("🪙 Карта дня на 3 дня (99 ₽)", {
    reply_markup: kb ?? undefined,
  });
});
bot.command("matrix", async (ctx) => {
  const kb = getAppInlineKeyboardForScreen("fate-matrix");
  await ctx.reply("🌌 Матрица судьбы / натальная карта", {
    reply_markup: kb ?? undefined,
  });
});
bot.command("my", async (ctx) => {
  const kb = getAppInlineKeyboardForScreen("my-readings");
  await ctx.reply("📂 Мои расклады", {
    reply_markup: kb ?? undefined,
  });
});

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

async function setupCommands() {
  await bot.api.setMyCommands([
    { command: "start", description: "Начать · Главное меню" },
    { command: "help", description: "Помощь" },
    { command: "app", description: "🔮 Открыть приложение" },
    { command: "free", description: "✨ Бесплатный вопрос таро" },
    { command: "spreads", description: "📋 Все расклады" },
    { command: "card3", description: "🪙 Карта дня на 3 дня" },
    { command: "matrix", description: "🌌 Матрица судьбы" },
    { command: "my", description: "📂 Мои расклады" },
  ]);
}

export { bot, setupCommands };
