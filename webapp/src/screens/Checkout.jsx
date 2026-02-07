import { useState } from "react";
import { getProduct, rubToStars } from "../constants/products";
import { getInitData } from "../utils/telegram";

const API_URL = import.meta.env.VITE_API_URL || "";
/** Юзернейм бота без @ (для перехода в чат после отправки счёта Stars) */
const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || "";

export default function Checkout({ onBack, productId }) {
  const [loading, setLoading] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [transferDetails, setTransferDetails] = useState(null);

  const product = productId ? getProduct(productId) : null;
  const priceStars = product ? rubToStars(product.price_rub) : 0;

  const payWithStars = async () => {
    if (!product) return;
    setError(null);
    setMessage(null);
    setLoading("stars");
    try {
      const base = API_URL || "";
      const res = await fetch(`${base}/api/request-stars-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: getInitData(),
          productId: product.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не удалось отправить счёт");
        return;
      }
      setMessage("Счёт отправлен. Открываю чат с ботом…");
      // Перекидываем в чат с ботом — пользователь сразу видит инвойс и может нажать «Оплатить»
      if (BOT_USERNAME && typeof window !== "undefined" && window.Telegram?.WebApp?.openTelegramLink) {
        try {
          window.Telegram.WebApp.openTelegramLink(`https://t.me/${BOT_USERNAME}`);
        } catch (_) {
          setMessage("Счёт в чате с ботом. Перейди в диалог с ботом и нажми «Оплатить».");
        }
      } else {
        setMessage("Счёт в чате с ботом. Перейди в диалог с ботом и нажми «Оплатить».");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуй ещё раз.");
    } finally {
      setLoading(null);
    }
  };

  const payWithCard = async () => {
    if (!product) return;
    setError(null);
    setMessage(null);
    setTransferDetails(null);
    setLoading("card");
    try {
      const base = API_URL || "";
      const res = await fetch(`${base}/api/create-external-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: getInitData(),
          productId: product.id,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Не удалось создать заказ");
        return;
      }
      if (data.paymentType === "transfer" && (data.card || data.sbpPhone)) {
        setTransferDetails({
          orderId: data.orderId,
          amount: data.amount,
          productTitle: data.productTitle,
          card: data.card,
          sbpPhone: data.sbpPhone,
        });
      } else if (data.paymentUrl) {
        window.open(data.paymentUrl, "_blank", "noopener");
        setMessage(data.message || "После оплаты по ссылке результат придёт в этот чат.");
      } else {
        setMessage(data.message || "Заказ создан. Сохрани номер заказа и напиши в чат боту после оплаты.");
      }
    } catch (err) {
      setError("Ошибка сети. Попробуй ещё раз.");
    } finally {
      setLoading(null);
    }
  };

  if (!product) {
    return (
      <div className="screen">
        <header className="header header-compact">
          <button type="button" className="btn-back" onClick={onBack}>
            ←
          </button>
          <h1>Оплата</h1>
        </header>
        <main>
          <div className="card">
            <p className="subtitle">Продукт не выбран.</p>
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Вернуться
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header className="header header-compact">
        <button type="button" className="btn-back" onClick={onBack}>
          ←
        </button>
        <h1>Оплата</h1>
      </header>
      <main>
        <div className="card checkout-card" data-aos="fade-up">
          <h2 className="checkout-product-title">{product.title}</h2>
          <p className="checkout-eta">Результат: {product.delivery_eta}</p>
          <p className="checkout-price">
            <strong>{product.price_rub} ₽</strong>
            <span className="checkout-stars"> или {priceStars} ⭐ Stars</span>
          </p>

          {error && (
            <p className="checkout-error" role="alert">
              {error}
            </p>
          )}
          {message && !transferDetails && (
            <p className="checkout-message" role="status">
              {message}
            </p>
          )}

          {transferDetails && (
            <div className="checkout-transfer card">
              <p className="checkout-transfer-title">
                Заказ №{transferDetails.orderId} · {transferDetails.amount} ₽
              </p>
              <p className="checkout-transfer-product">{transferDetails.productTitle}</p>
              {transferDetails.card && (
                <p className="checkout-transfer-detail">
                  <strong>Карта:</strong> {transferDetails.card}
                </p>
              )}
              {transferDetails.sbpPhone && (
                <p className="checkout-transfer-detail">
                  <strong>СБП (по номеру):</strong> {transferDetails.sbpPhone}
                </p>
              )}
              <p className="checkout-transfer-hint">
                В комментарии к переводу укажи <strong>№{transferDetails.orderId}</strong>. После оплаты напиши в чат боту — пришлём результат.
              </p>
            </div>
          )}

          <div className="checkout-actions">
            <button
              type="button"
              className="btn btn-primary checkout-btn"
              onClick={payWithStars}
              disabled={loading !== null}
            >
              {loading === "stars" ? "Отправляем счёт…" : "Оплатить Stars (в чате)"}
            </button>
            <button
              type="button"
              className="btn btn-secondary checkout-btn"
              onClick={payWithCard}
              disabled={loading !== null}
            >
              {loading === "card" ? "Создаём заказ…" : "Оплатить картой / СБП"}
            </button>
          </div>

          <p className="checkout-hint">
            Stars — оплата в чате с ботом. Карта / СБП — перевод по реквизитам; после оплаты напиши в чат боту.
          </p>
        </div>
      </main>
    </div>
  );
}
