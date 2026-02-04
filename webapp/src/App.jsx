import { useEffect } from "react";
import AOS from "aos";
import { useNavigation } from "./hooks/useNavigation";
import { useNatalChart } from "./context/NatalChartContext";
import ScreenRouter from "./components/ScreenRouter";
import { ScreenId } from "./constants/screens";

export default function App() {
  const { currentScreen, goTo, goBack, stubTitle, screenPayload } =
    useNavigation();

  useEffect(() => {
    AOS.init({
      duration: 500,
      easing: "ease-out-cubic",
      offset: 20,
      once: true,
      disable: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
  }, []);

  useEffect(() => {
    AOS.refresh();
  }, [currentScreen]);
  const { isCalculating, justCalculated, clearJustCalculated } =
    useNatalChart();

  const showHeader = currentScreen !== ScreenId.LANDING;

  const openProfile = () => {
    clearJustCalculated();
    goTo(ScreenId.PROFILE);
  };

  return (
    <>
      {isCalculating && (
        <div
          className="global-natal-indicator"
          role="status"
          aria-live="polite"
        >
          <div className="global-natal-indicator-track">
            <div className="global-natal-indicator-fill" />
          </div>
          <span className="global-natal-indicator-text">
            Рассчитываем асцендент и натальную карту…
          </span>
        </div>
      )}
      {showHeader && (
        <header className="app-topbar">
          <div className="app-topbar-left">
            <span className="logo logo-small">🔮</span>
            <span className="app-topbar-title">Женский Аркан</span>
          </div>
          <button
            type="button"
            className="app-profile-btn"
            onClick={openProfile}
            aria-label="Личный кабинет"
          >
            <svg
              className="app-profile-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle
                cx="12"
                cy="8"
                r="3.2"
              />
              <path d="M5 20.5c0-3.5 3.1-6 7-6s7 2.5 7 6" />
            </svg>
          </button>
        </header>
      )}
      {justCalculated && currentScreen !== ScreenId.PROFILE && (
        <button
          type="button"
          className="natal-ready-notice"
          onClick={openProfile}
          aria-live="polite"
        >
          ✨ Натальная карта готова — смотри в личном кабинете
        </button>
      )}
      <ScreenRouter
        currentScreen={currentScreen}
        goTo={goTo}
        goBack={goBack}
        stubTitle={stubTitle}
        screenPayload={screenPayload}
      />
    </>
  );
}
