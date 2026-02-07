import { getOrderByPayload, updateOrderPaid } from "../db.js";
import { getProduct } from "../config/products.js";

/** Подтверждение перед оплатой (Stars): проверяем заказ и разрешаем платёж */
export async function handlePreCheckout(ctx) {
  const query = ctx.preCheckoutQuery;
  const payload = query.invoice_payload;
  const order = getOrderByPayload(payload);

  if (!order) {
    await query.answer({
      ok: false,
      error_message: "Заказ не найден. Попробуй оформить заказ снова из приложения.",
    });
    return;
  }

  if (order.status !== "pending") {
    await query.answer({
      ok: false,
      error_message: "Этот заказ уже оплачен или отменён.",
    });
    return;
  }

  if (order.user_id !== ctx.from?.id) {
    await query.answer({
      ok: false,
      error_message: "Счёт был отправлен другому пользователю. Оформи заказ из своего приложения.",
    });
    return;
  }

  await query.answer({ ok: true });
}

/** Успешная оплата Stars: помечаем заказ оплаченным и пишем пользователю */
export async function handleSuccessfulPayment(ctx) {
  const msg = ctx.message;
  const payment = msg.successful_payment;
  if (!payment?.invoice_payload) return;

  const order = getOrderByPayload(payment.invoice_payload);
  if (!order) {
    await ctx.reply("Оплата получена, но заказ не найден. Напиши в поддержку с номером заказа.");
    return;
  }

  updateOrderPaid(order.id, payment.telegram_payment_charge_id);
  const product = getProduct(order.product_id);
  const eta = product?.delivery_eta || "в ближайшее время";

  await ctx.reply(
    `✅ Заказ №${order.id} оплачен.\n\n` +
      `📦 ${order.product_title}\n\n` +
      `Результат придёт в этот чат ${eta}. Следи за сообщениями — мы отправим тебе расклад или отчёт сюда.\n\n` +
      `Если что-то не так — напиши /support или нажми кнопку поддержки в меню.`
  );
}
