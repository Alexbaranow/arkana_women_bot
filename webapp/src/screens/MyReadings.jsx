import { useMemo } from "react";
import { MoonLoader } from "react-spinners";
import { ScreenId } from "../constants/screens";
import { getOrderStatusLabel } from "../constants/orders";
import { formatOrderDate } from "../utils/format";
import { useMyOrders } from "../hooks/useMyOrders";

const AWAITING_STATUSES = ["pending", "paid"];

export default function MyReadings({ onBack, onNavigate }) {
  const { orders, loading } = useMyOrders();
  const { awaiting, delivered } = useMemo(
    () => ({
      awaiting: orders.filter((o) => AWAITING_STATUSES.includes(o.status)),
      delivered: orders.filter((o) => o.status === "delivered"),
    }),
    [orders]
  );

  return (
    <div className="screen">
      <header className="header header-compact">
        <button type="button" className="btn-back" onClick={onBack}>
          ←
        </button>
        <h1>Мои расклады</h1>
      </header>
      <main>
        {loading ? (
          <div className="my-readings-loading">
            <MoonLoader size={36} color="var(--color-primary)" />
            <p className="profile-subtext">Загрузка…</p>
          </div>
        ) : (
          <>
            <section className="my-readings-section" data-aos="fade-up">
              <h2 className="profile-section-title">Ожидают оплату / В работе</h2>
              {awaiting.length === 0 ? (
                <p className="profile-subtext">Нет заказов в ожидании.</p>
              ) : (
                <ul className="my-readings-list">
                  {awaiting.map((o) => (
                    <li key={o.id} className="my-readings-order-card card">
                      <div className="my-readings-order-header">
                        <span className="my-readings-order-title">{o.product_title}</span>
                        <span className="my-readings-order-status my-readings-order-status-pending">
                          {getOrderStatusLabel(o.status)}
                        </span>
                      </div>
                      <p className="my-readings-order-meta">
                        {o.price_rub} ₽
                        {o.paid_at && <> · Оплачен {formatOrderDate(o.paid_at)}</>}
                        {!o.paid_at && o.created_at && <> · Создан {formatOrderDate(o.created_at)}</>}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="my-readings-section" data-aos="fade-up" data-aos-delay="50">
              <h2 className="profile-section-title">Исполненные заказы</h2>
              {delivered.length === 0 ? (
                <p className="profile-subtext">Пока нет исполненных заказов.</p>
              ) : (
                <ul className="my-readings-list">
                  {delivered.map((o) => (
                    <li key={o.id} className="my-readings-order-card card my-readings-order-delivered">
                      <div className="my-readings-order-header">
                        <span className="my-readings-order-title">{o.product_title}</span>
                        <span className="my-readings-order-status my-readings-order-status-delivered">
                          {getOrderStatusLabel(o.status)}
                        </span>
                      </div>
                      <p className="my-readings-order-meta">
                        {o.price_rub} ₽ · {formatOrderDate(o.paid_at || o.created_at)}
                      </p>
                      {o.result_text && (
                        <div className="my-readings-order-description">{o.result_text}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <div className="my-readings-footer">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => onNavigate(ScreenId.PROFILE)}
              >
                Личный кабинет
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
