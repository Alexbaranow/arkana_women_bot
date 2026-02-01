import { getAnswer } from "../services/ai.js";
import { hasFreeQuestion, useFreeQuestion } from "../db.js";

const STEP = "free_question_waiting";

export function isWaitingFreeQuestion(session) {
  return session?.step === STEP;
}

/** Обработка текста сообщения как бесплатного вопроса к нейросети */
export async function handleFreeQuestionMessage(ctx) {
  if (!isWaitingFreeQuestion(ctx.session)) return false;

  const text = ctx.message?.text?.trim();
  if (!text) {
    await ctx.reply("Напиши, пожалуйста, свой вопрос текстом 👇");
    return true;
  }

  if (text.length < 5) {
    await ctx.reply("Опиши вопрос чуть подробнее, хотя бы в несколько слов 🙏");
    return true;
  }

  // Проверяем ещё раз: мог пройти срок или кто-то подставил сессию
  if (!hasFreeQuestion(ctx.from.id)) {
    ctx.session.step = null;
    await ctx.reply(
      "⏳ Твой бесплатный вопрос уже использован. Следующий будет доступен через 3 дня."
    );
    return true;
  }

  const loadingMsg = await ctx.reply("🔮 Думаю над твоим вопросом...");

  try {
    const answer = await getAnswer(text);
    useFreeQuestion(ctx.from.id);
    ctx.session.step = null;

    await ctx.api.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      `✨ Ответ на твой вопрос:\n\n${answer}\n\nБесплатный вопрос использован. Следующий будет через 3 дня.`
    );
  } catch (err) {
    console.error("AI free question error:", err);
    ctx.session.step = null;
    await ctx.api.editMessageText(
      ctx.chat.id,
      loadingMsg.message_id,
      "😔 Что-то пошло не так при обращении к звёздам ✨. Попробуй позже или напиши вопрос короче."
    );
  }

  return true;
}
