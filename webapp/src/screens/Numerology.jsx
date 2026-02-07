import { useState } from "react";
import { ScreenId } from "../constants/screens";
import { isUserRegistered } from "./Onboarding";

const NUMEROLOGY_ITEMS = [
  {
    id: "fate-matrix",
    title: "Матрица судьбы",
    shortDesc: "По дате рождения",
    icon: "🌌",
    price: 290,
    description:
      "Узнай свой код судьбы: сильные стороны, зоны роста и задачи души в одном понятном расчёте. Матрица судьбы по дате рождения раскладывает твою энергию по полочкам — почему повторяются одни и те же ситуации, где твой дар и где подводные камни. Один раз рассчитал — пользуешься всю жизнь как личной картой возможностей.",
    whatIncluded: [
      "Расчёт матрицы по твоей дате рождения",
      "Сильные и слабые архетипы, энергии души и тела",
      "Кармические задачи и предназначение",
      "Понятная расшифровка — без воды, по делу",
    ],
  },
  {
    id: "natal-chart",
    title: "Натальная карта",
    shortDesc: "Арканы Таро и астрология по дате рождения",
    icon: "⭐",
    price: 790,
    description:
      "Глубже матрицы: твоя натальная карта через призму Таро и астрологии. Архетипы, ключевые арканы и энергии жизни — что заложено в тебе с рождения, какие темы и сценарии ведут по жизни. Укажи дату, время и место рождения — получи персональный текст о твоей карте. Идеально для тех, кто хочет не просто цифры, а связную историю души и связь с картами.",
    whatIncluded: [
      "Натальная карта по дате (и при возможности — времени и месту) рождения",
      "Ключевые арканы Таро и их значение в твоей жизни",
      "Асцендент и его связь с арканами",
      "2–3 абзаца персонального описания: энергии, темы, потенциал",
    ],
  },
];

export default function Numerology({ onBack, onNavigate }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleOrder = (e, id) => {
    e.stopPropagation();
    if (isUserRegistered()) {
      onNavigate(ScreenId.CHECKOUT, { productId: id });
    } else {
      onNavigate(ScreenId.ONBOARDING, { next: id });
    }
  };

  return (
    <div className="screen">
      <header
        className="header header-compact"
        data-aos="fade-down"
      >
        <button
          type="button"
          className="btn-back"
          onClick={onBack}
        >
          ←
        </button>
        <h1>Нумерология</h1>
      </header>

      <main>
        <p
          className="subtitle"
          style={{ marginBottom: "20px" }}
          data-aos="fade-up"
          data-aos-delay="50"
        >
          Матрица судьбы и натальная карта — персональный расчёт по твоим данным
        </p>

        <div className="spread-list">
          {NUMEROLOGY_ITEMS.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className={`spread-card spread-card-paid ${
                  isExpanded ? "spread-card-expanded" : ""
                }`}
              >
                <button
                  type="button"
                  className="spread-card-head"
                  onClick={() => toggle(item.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="menu-icon">{item.icon}</span>
                  <div className="menu-text spread-card-text">
                    <span className="menu-title">{item.title}</span>
                    <span className="menu-desc">{item.shortDesc}</span>
                  </div>
                  <span className="menu-price spread-card-price">
                    {item.price} ₽
                  </span>
                  <span
                    className="spread-card-chevron"
                    aria-hidden
                  >
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="spread-card-body">
                    <p className="spread-card-description">
                      {item.description}
                    </p>
                    <p className="spread-card-label">Что входит:</p>
                    <ul className="spread-card-list">
                      {item.whatIncluded.map((entry, i) => (
                        <li key={i}>{entry}</li>
                      ))}
                    </ul>
                    <p className="spread-card-total">
                      Стоимость: <strong>{item.price} ₽</strong>
                    </p>
                    <p className="spread-card-trust">
                      Персональный расчёт по твоим данным · Конфиденциально 🔒
                    </p>
                    <button
                      type="button"
                      className="btn btn-primary spread-card-btn"
                      onClick={(e) => handleOrder(e, item.id)}
                    >
                      {item.id === "fate-matrix"
                        ? "Рассчитать матрицу"
                        : "Рассчитать натальную карту"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
