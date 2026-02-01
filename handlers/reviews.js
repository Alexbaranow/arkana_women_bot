import { getVisibleReviews } from "../db.js";

/** Посмотреть отзывы */
export async function handleViewReviews(ctx) {
  const reviews = getVisibleReviews(15);

  if (reviews.length === 0) {
    await ctx.reply(
      "⭐ Пока нет отзывов.\n\nСтань первой, кто оставит отзыв — нажми «✨ Оставить свой отзыв 🌟»"
    );
    return;
  }

  let text = "⭐ *Отзывы клиентов*\n\n";

  reviews.forEach((r, i) => {
    const stars = "⭐".repeat(r.rating || 5);
    const name = r.first_name || "Клиент";
    const date = new Date(r.created_at).toLocaleDateString("ru-RU");
    text += `${stars}\n${name} • ${date}\n`;
    if (r.text) text += `${r.text}\n`;
    text += "\n";
  });

  await ctx.reply(text, { parse_mode: "Markdown" });
}

/** Оставить отзыв — пока заглушка, полный флоу в следующем шаге */
export async function handleLeaveReview(ctx) {
  await ctx.reply(
    "✨ Спасибо за желание оставить отзыв! 🌟\n\nФункция скоро будет доступна — следи за обновлениями."
  );
}
