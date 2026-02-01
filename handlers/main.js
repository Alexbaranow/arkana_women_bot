import { getOpenAppInlineKeyboard } from "./start.js";
import { hasFreeQuestion, needsOnboarding } from "../db.js";
import { startOnboarding } from "./onboarding.js";

const FREE_QUESTION_STEP = "free_question_waiting";

/** Запуск бесплатного вопроса (кнопка «Предсказание по запросу» или инлайн «Получить предсказание») */
export async function handlePredictionRequest(ctx) {
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

/** Обработка инлайн-кнопок главного меню */
export async function handleMainCallback(ctx) {
  const action = ctx.callbackQuery.data.split(":")[1];
  await ctx.answerCallbackQuery();

  switch (action) {
    case "prediction_today":
    case "free_tarot":
      await handleFreeTarot(ctx);
      break;
    case "natal_chart":
      await handleNatalChart(ctx);
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
    case "status":
      await ctx.reply("Пока пусто.");
      break;
    default: {
      const keyboard = getOpenAppInlineKeyboard();
      await ctx.reply(
        "Открой приложение по кнопке под сообщением 👇 — там всё меню и бесплатный вопрос.",
        { ...(keyboard && { reply_markup: keyboard }) }
      );
    }
  }
}

async function handleFreeTarot(ctx) {
  return handlePredictionRequest(ctx);
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

async function handleNatalChart(ctx) {
  if (needsOnboarding(ctx.from.id)) {
    await ctx.reply(
      "Чтобы сгенерировать карту, нужно заполнить профиль. Нажми кнопку «Профиль 👤» ниже или начни заполнение:"
    );
    return startOnboarding(ctx);
  }
  const keyboard = getOpenAppInlineKeyboard();
  await ctx.reply(
    "Натальная карта доступна в приложении. Нажми кнопку ниже 👇",
    { ...(keyboard && { reply_markup: keyboard }) }
  );
}
