import { getVisibleReviews } from "../db.js";

/** Посмотреть отзывы */
export async function handleViewReviews(ctx) {
  const reviews = getVisibleReviews(15);

  if (reviews.length === 0) {
    await ctx.reply(
      "⭐ Пока отзывов нет — ты можешь стать первой!\n\nОткрой приложение (кнопка под сообщением «Начать») и там будет «Оставить отзыв»."
    );
    return;
  }

  let text = "⭐ *Отзывы*\n\n";

  reviews.forEach((r) => {
    const stars = "⭐".repeat(r.rating || 5);
    const name = r.first_name || "Клиент";
    const date = new Date(r.created_at).toLocaleDateString("ru-RU");
    text += `${stars}\n${name} · ${date}\n`;
    if (r.text) text += `${r.text}\n`;
    text += "\n";
  });

  await ctx.reply(text, { parse_mode: "Markdown" });
}
