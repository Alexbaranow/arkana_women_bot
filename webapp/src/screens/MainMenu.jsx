import { ScreenId } from "../constants/screens";
import { isUserRegistered } from "./Onboarding";

export default function MainMenu({ onNavigate }) {
  const handleFreeTarot = () => {
    if (isUserRegistered()) {
      onNavigate(ScreenId.FREE_TAROT);
    } else {
      onNavigate(ScreenId.ONBOARDING, { next: ScreenId.FREE_TAROT });
    }
  };

  return (
    <div className="screen">
      <main>
        <p
          className="section-label"
          data-aos="fade-right"
        >
          Бесплатный вопрос
        </p>
        <button
          className="menu-card menu-card-featured"
          onClick={handleFreeTarot}
          data-aos="fade-up"
          data-aos-delay="50"
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
          data-aos="fade-right"
          data-aos-delay="100"
        >
          Расклады и услуги
        </p>
        <div className="menu-grid">
          <button
            className="menu-card"
            onClick={() => onNavigate(ScreenId.ALL_SPREADS)}
            data-aos="fade-up"
            data-aos-delay="150"
          >
            <span className="menu-icon">📋</span>
            <div className="menu-text">
              <span className="menu-title">Все расклады</span>
            </div>
          </button>
          <button
            className="menu-card"
            onClick={() => onNavigate(ScreenId.NUMEROLOGY)}
            data-aos="fade-up"
            data-aos-delay="120"
          >
            <span className="menu-icon">🔢</span>
            <div className="menu-text">
              <span className="menu-title">Нумерология</span>
              <span className="menu-desc">матрица судьбы, натальная карта</span>
            </div>
          </button>
          <button
            className="menu-card menu-card-paid"
            onClick={() =>
              isUserRegistered()
                ? onNavigate("card-3days")
                : onNavigate(ScreenId.ONBOARDING, { next: "card-3days" })
            }
            data-aos="fade-up"
            data-aos-delay="180"
          >
            <span className="menu-icon">🪙</span>
            <div className="menu-text">
              <span className="menu-title">Карта дня на 3 дня</span>
            </div>
            <span className="menu-price">100 ₽</span>
          </button>
          <button
            className="menu-card"
            onClick={() => onNavigate("my-readings")}
            data-aos="fade-up"
            data-aos-delay="210"
          >
            <span className="menu-icon">📂</span>
            <div className="menu-text">
              <span className="menu-title">Мои расклады</span>
            </div>
          </button>
        </div>

        <div
          className="divider"
          data-aos="fade"
          data-aos-delay="250"
        ></div>

        <div
          className="menu-footer"
          data-aos="fade-up"
          data-aos-delay="280"
        >
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
