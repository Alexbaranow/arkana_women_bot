import { ScreenId } from "../constants/screens";

export default function MainMenu({ onNavigate }) {
  return (
    <div className="screen">
      <header className="header header-compact">
        <div className="logo logo-small">🔮</div>
        <h1>Женский Аркан</h1>
      </header>

      <main>
        <p className="section-label">Бесплатный вопрос</p>
        <button
          className="menu-card menu-card-featured"
          onClick={() => onNavigate(ScreenId.FREE_TAROT)}
        >
          <span className="menu-icon">✨</span>
          <div className="menu-text">
            <span className="menu-title">Задать вопрос картам</span>
            <span className="menu-desc">Обновляется раз в 3 дня</span>
          </div>
        </button>

        <p
          className="section-label"
          style={{ marginTop: "20px" }}
        >
          Расклады и услуги
        </p>
        <div className="menu-grid">
          <button
            className="menu-card"
            onClick={() => onNavigate("all-spreads")}
          >
            <span className="menu-icon">📋</span>
            <div className="menu-text">
              <span className="menu-title">Все расклады</span>
            </div>
          </button>
          <button
            className="menu-card menu-card-paid"
            onClick={() => onNavigate("card-3days")}
          >
            <span className="menu-icon">🪙</span>
            <div className="menu-text">
              <span className="menu-title">Карта дня на 3 дня</span>
            </div>
            <span className="menu-price">100 ₽</span>
          </button>
          <button
            className="menu-card"
            onClick={() => onNavigate("fate-matrix")}
          >
            <span className="menu-icon">🌌</span>
            <div className="menu-text">
              <span className="menu-title">Матрица судьбы</span>
              <span className="menu-desc">по дате рождения</span>
            </div>
          </button>
          <button
            className="menu-card"
            onClick={() => onNavigate("my-readings")}
          >
            <span className="menu-icon">📂</span>
            <div className="menu-text">
              <span className="menu-title">Мои расклады</span>
            </div>
          </button>
        </div>

        <div className="divider"></div>

        <div className="menu-footer">
          <button
            className="btn btn-secondary"
            onClick={() => onNavigate(ScreenId.REVIEWS)}
          >
            ⭐ Отзывы
          </button>
          <button
            className="btn btn-outline"
            onClick={() => onNavigate(ScreenId.LEAVE_REVIEW)}
          >
            ✨ Оставить отзыв
          </button>
        </div>
      </main>
    </div>
  );
}
