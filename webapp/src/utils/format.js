import React from "react";

/**
 * Форматирование текста для отображения
 */

/**
 * Рендерит строку с markdown-жирным (**текст**): разбивает по ** и чередует обычный текст и <strong>.
 */
export function renderTextWithBold(text) {
  if (typeof text !== "string" || !text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}
