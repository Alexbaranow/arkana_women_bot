import "dotenv/config";
import { Bot, session } from "grammy";
import { createUser } from "./db.js";
import { handleStart } from "./handlers/start.js";
import { handleViewReviews, handleLeaveReview } from "./handlers/reviews.js";
import { handleMainCallback } from "./handlers/main.js";
import { handleOnboardingMessage } from "./handlers/onboarding.js";

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
  if (ctx.from) {
    createUser(
      ctx.from.id,
      ctx.from.username,
      ctx.from.first_name,
      ctx.from.last_name
    );
  }
  await next();
});

// === Команды ===
bot.command("start", handleStart);

// === Онбординг: перехват сообщений при сборе данных ===
bot.on("message:text", async (ctx, next) => {
  if (ctx.session?.step) {
    const handled = await handleOnboardingMessage(ctx);
    if (handled) return;
  }
  await next();
});

// === Обычные кнопки (Reply) ===
bot.hears("⭐ Отзывы клиентов 👀", handleViewReviews);
bot.hears("✨ Оставить свой отзыв 🌟", handleLeaveReview);

// === Инлайн-кнопки главного меню ===
bot.callbackQuery(/^main:/, handleMainCallback);

// === Обработка ошибок ===
bot.catch((err) => {
  console.error("Bot error:", err);
});

console.log("🔮 Arkana Bot запускается...");
bot.start();
