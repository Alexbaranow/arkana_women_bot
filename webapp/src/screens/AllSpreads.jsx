import { useState } from "react";
import { ScreenId } from "../constants/screens";
import { isUserRegistered } from "./Onboarding";

const SPREADS = [
  {
    id: "card-day",
    title: "Карта дня",
    shortDesc: "Одна карта на сегодня — совет или тема дня",
    icon: "🃏",
    price: null,
    description:
      "Одна карта Таро на текущий день: энергия дня, совет или тема, на которую стоит обратить внимание. Идеально для утреннего настроя.",
    whatIncluded: [
      "Одна карта Таро на сегодня",
      "Текстовое описание и совет",
      "Отправка в течение дня",
    ],
  },
  {
    id: "card-3days",
    title: "Карта дня на 3 дня",
    shortDesc: "Три карты на три дня вперёд",
    icon: "🪙",
    price: 100,
    description:
      "Три карты на три ближайших дня: что несёт каждый день, на что обратить внимание, практические подсказки.",
    whatIncluded: [
      "Три карты (день 1, 2, 3)",
      "Описание и совет по каждому дню",
      "Отправка в течение 24 часов",
    ],
  },
  {
    id: "three-cards",
    title: "Три карты",
    shortDesc: "Прошлое — настоящее — будущее",
    icon: "📜",
    price: null,
    description:
      "Классический расклад из трёх карт: как ситуация развивалась, что происходит сейчас и какой возможный исход при текущем векторе.",
    whatIncluded: [
      "Три карты (прошлое, настоящее, будущее)",
      "Связное описание сценария",
      "Рекомендации при необходимости",
    ],
  },
  {
    id: "relationship",
    title: "Расклад на отношения",
    shortDesc: "Ты, партнёр, связь и перспективы",
    icon: "💕",
    price: null,
    description:
      "Расклад про партнёрство: твоя позиция, позиция партнёра, что связывает, что мешает, возможное развитие отношений.",
    whatIncluded: [
      "Несколько карт по позициям отношений",
      "Толкование с учётом контекста",
      "Ответы на уточняющие вопросы по раскладу",
    ],
  },
  {
    id: "situation",
    title: "Расклад на ситуацию",
    shortDesc: "Ответ на конкретный вопрос",
    icon: "❓",
    price: null,
    description:
      "Расклад на твой конкретный вопрос: карты показывают суть ситуации, скрытые факторы и варианты действий.",
    whatIncluded: [
      "Расклад под твой вопрос",
      "Разбор позиций и связей карт",
      "Практические рекомендации",
    ],
  },
  {
    id: "fate-matrix",
    title: "Матрица судьбы",
    shortDesc: "По дате рождения",
    icon: "🌌",
    price: null,
    description:
      "Нумерологическая матрица по дате рождения: сильные и слабые арканы, задачи по квадратам, связь с Таро.",
    whatIncluded: [
      "Расчёт матрицы по дате рождения",
      "Описание арканов и их значений",
      "Сильные стороны и зоны роста",
    ],
  },
  {
    id: "natal-chart",
    title: "Натальная карта",
    shortDesc: "Карта рождения и арканы по дате",
    icon: "⭐",
    price: null,
    description:
      "Натальная карта Таро по дате рождения: арканы, связанные с твоим рождением, базовые энергии и темы жизни.",
    whatIncluded: [
      "Расчёт арканов по дате рождения",
      "Описание личных арканов",
      "Связь с жизненными темами",
    ],
  },
];

export default function AllSpreads({ onBack, onNavigate }) {
  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleOrder = (e, id) => {
    e.stopPropagation();
    if (isUserRegistered()) {
      onNavigate(id);
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
          className="btn-back"
          onClick={onBack}
        >
          ←
        </button>
        <h1>Все расклады</h1>
      </header>

      <main>
        <p
          className="subtitle"
          style={{ marginBottom: "8px" }}
          data-aos="fade-up"
          data-aos-delay="50"
        >
          Выбери расклад — все расклады делает реальный человек
        </p>
        <p
          className="subtitle"
          style={{
            marginBottom: "20px",
            fontSize: "13px",
            color: "var(--color-text-muted)",
          }}
          data-aos="fade-up"
          data-aos-delay="80"
        >
          🔮 Не бот: живая интерпретация карт
        </p>

        <div className="spread-list">
          {SPREADS.map((s, idx) => {
            const isExpanded = expandedId === s.id;
            return (
              <div
                key={s.id}
                className={`spread-card ${s.price ? "spread-card-paid" : ""} ${
                  isExpanded ? "spread-card-expanded" : ""
                }`}
              >
                <button
                  type="button"
                  className="spread-card-head"
                  onClick={() => toggle(s.id)}
                  aria-expanded={isExpanded}
                >
                  <span className="menu-icon">{s.icon}</span>
                  <div className="menu-text spread-card-text">
                    <span className="menu-title">{s.title}</span>
                    <span className="menu-desc">{s.shortDesc}</span>
                  </div>
                  {s.price != null && (
                    <span className="menu-price spread-card-price">
                      {s.price} ₽
                    </span>
                  )}
                  <span
                    className="spread-card-chevron"
                    aria-hidden
                  >
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isExpanded && (
                  <div className="spread-card-body">
                    <p className="spread-card-description">{s.description}</p>
                    <p className="spread-card-label">Что входит:</p>
                    <ul className="spread-card-list">
                      {s.whatIncluded.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                    {s.price != null && (
                      <p className="spread-card-total">
                        Стоимость: <strong>{s.price} ₽</strong>
                      </p>
                    )}
                    <button
                      type="button"
                      className="btn btn-primary spread-card-btn"
                      onClick={(e) => handleOrder(e, s.id)}
                    >
                      Заказать расклад
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
