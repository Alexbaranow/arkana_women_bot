import { getMainInlineKeyboard } from "./start.js";
import { hasFreeQuestion } from "../db.js";

/** Обработка инлайн-кнопок главного меню */
export async function handleMainCallback(ctx) {
  const action = ctx.callbackQuery.data.split(":")[1];
  await ctx.answerCallbackQuery();

  switch (action) {
    case "free_tarot":
      await handleFreeTarot(ctx);
      break;
    case "all_spreads":
      await handleAllSpreads(ctx);
      break;
    case "card_3days":
      await handleCard3Days(ctx);
      break;
    case "fate_matrix":
      await handleFateMatrix(ctx);
      break;
    case "my_readings":
      await handleMyReadings(ctx);
      break;
    default:
      await ctx.reply("Выбери действие:", {
        reply_markup: getMainInlineKeyboard(),
      });
  }
}

const FREE_QUESTION_STEP = "free_question_waiting";

async function handleFreeTarot(ctx) {
  const freeAvailable = hasFreeQuestion(ctx.from.id);

  if (!freeAvailable) {
    await ctx.reply(
      "⏳ Твой бесплатный вопрос обновится через несколько дней (раз в 3 дня).\n\nМожешь выбрать платный расклад в разделе «Все расклады 📋»."
    );
    return;
  }

  ctx.session.step = FREE_QUESTION_STEP;
  await ctx.reply(
    "✨ Один бесплатный вопрос к нейросети. Напиши свой вопрос одним сообщением 👇"
  );
}

async function handleAllSpreads(ctx) {
  await ctx.reply("📋 Все расклады — в следующем шаге.");
}

async function handleCard3Days(ctx) {
  await ctx.reply("🪙 Карта дня на 3 дня (100 ₽) — в следующем шаге.");
}

async function handleFateMatrix(ctx) {
  await ctx.reply(
    "🌌 Матрица судьбы по дате рождения — в следующем шаге.\n\nНам понадобится твоя дата рождения (ДД.ММ.ГГГГ)."
  );
}

async function handleMyReadings(ctx) {
  await ctx.reply("📂 Мои расклады / покупки — в следующем шаге.");
}
