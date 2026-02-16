import { useEffect } from "react";
import AOS from "aos";
import TarotShuffleLoader from "./components/TarotShuffleLoader";
import { useNavigation } from "./hooks/useNavigation";
import { useNatalChart } from "./context/NatalChartContext";
import { useCardDayRequest } from "./context/CardDayRequestContext";
import ScreenRouter from "./components/ScreenRouter";
import { ScreenId } from "./constants/screens";
import { getInitData } from "./utils/telegram";
import { getApiUrl } from "./config/api";

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
  const { justCardDayDone, clearJustCardDayDone } = useCardDayRequest();

  const showHeader = currentScreen !== ScreenId.LANDING;

  const openProfile = () => {
    clearJustCalculated();
    clearJustCardDayDone();
    goTo(ScreenId.PROFILE);
  };

  useEffect(() => {
    if (currentScreen === ScreenId.PROFILE) clearJustCardDayDone();
  }, [currentScreen, clearJustCardDayDone]);

  const showReadyNotice =
    (justCalculated || justCardDayDone) && currentScreen !== ScreenId.PROFILE;
  const readyNoticeText = justCalculated
    ? "✨ Натальная карта готова — смотри в личном кабинете"
    : "✨ Карта дня готова — смотри в личном кабинете";

  const resetStorage = async () => {
    try {
      const base = getApiUrl() || "";
      await fetch(`${base}/api/card-of-the-day/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: getInitData() }),
      });
    } catch {
      // игнорируем ошибку API — сбрасываем локальные данные в любом случае
    }
    // Сбрасываем все данные приложения (только localStorage)
    Object.keys(localStorage)
      .filter((k) => k.startsWith("arkana_"))
      .forEach((k) => localStorage.removeItem(k));
    // Редирект в начало приложения без query/hash — после reload откроется Landing
    const url = `${window.location.origin}${window.location.pathname}`;
    window.location.replace(url);
  };

  return (
    <>
      {showHeader && (
        <header className="app-topbar">
          <div className="app-topbar-left">
            <span className="logo logo-small">🔮</span>
            <span className="app-topbar-title">Женский Аркан</span>
          </div>
          <div className="app-topbar-right">
            {isCalculating && (
              <div className="app-topbar-spinner">
                <TarotShuffleLoader
                  size={28}
                  aria-label="Рассчитываем асцендент и натальную карту"
                />
              </div>
            )}
            <button
              type="button"
              className="app-profile-btn app-debug-btn"
              onClick={resetStorage}
              aria-label="Сбросить данные (отладка)"
              title="Сбросить все данные"
            >
              ↺
            </button>
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
          </div>
        </header>
      )}
      {showReadyNotice && (
        <button
          type="button"
          className="natal-ready-notice"
          onClick={openProfile}
          aria-live="polite"
        >
          {readyNoticeText}
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
