import { ScreenId } from "../constants/screens";
import { isUserRegistered } from "./Onboarding";

export default function Numerology({ onBack, onNavigate }) {
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
        <div
          className="menu-grid"
          style={{ marginTop: "8px" }}
        >
          <button
            className="menu-card menu-card-paid"
            onClick={() =>
              isUserRegistered()
                ? onNavigate("fate-matrix")
                : onNavigate(ScreenId.ONBOARDING, { next: "fate-matrix" })
            }
            data-aos="fade-up"
            data-aos-delay="50"
          >
            <span className="menu-icon">🌌</span>
            <div className="menu-text">
              <span className="menu-title">Матрица судьбы</span>
              <span className="menu-desc">по дате рождения</span>
            </div>
            <span className="menu-price">550 ₽</span>
          </button>
          <button
            className="menu-card menu-card-paid"
            onClick={() =>
              isUserRegistered()
                ? onNavigate("natal-chart")
                : onNavigate(ScreenId.ONBOARDING, { next: "natal-chart" })
            }
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <span className="menu-icon">⭐</span>
            <div className="menu-text">
              <span className="menu-title">Натальная карта</span>
              <span className="menu-desc">арканы по дате рождения</span>
            </div>
            <span className="menu-price">850 ₽</span>
          </button>
        </div>
      </main>
    </div>
  );
}
