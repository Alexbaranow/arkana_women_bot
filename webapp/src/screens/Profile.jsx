import { useEffect, useState, useMemo } from "react";
import { useNatalChart } from "../context/NatalChartContext";
import { getOnboardingUser, saveOnboardingUser } from "./Onboarding";
import { getInitData } from "../utils/telegram";
import { ScreenId } from "../constants/screens";
import { getTarotCardImageForNatal } from "../constants/tarotCards";

/**
 * Рендерит строку с markdown-жирным (**текст**): разбивает по ** и чередует обычный текст и <strong>.
 */
function renderTextWithBold(text) {
  if (typeof text !== "string" || !text) return null;
  const parts = text.split(/\*\*(.*?)\*\*/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

/** Парсит ascendant из объекта или JSON-строки */
function parseAscendant(raw) {
  if (!raw) return null;
  if (typeof raw === "object" && raw !== null && !Array.isArray(raw)) {
    const sign = String(raw.sign ?? "").trim();
    const description = String(raw.description ?? "").trim();
    return sign || description ? { sign, description } : null;
  }
  if (typeof raw === "string" && raw.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(raw);
      const asc = parsed?.ascendant ?? parsed;
      return parseAscendant(asc);
    } catch {
      return null;
    }
  }
  return null;
}

/** Извлекает читаемые данные для отображения: если сохранён сырой JSON — парсим и показываем только нужное */
function getDisplayNatal(natalResult) {
  if (!natalResult) return null;
  const natalChartStr =
    typeof natalResult.natalChart === "string"
      ? natalResult.natalChart.trim()
      : "";
  let ascendant = parseAscendant(natalResult.ascendant);
  let chartText =
    typeof natalResult.natalChart === "string" ? natalResult.natalChart : "";

  if (natalChartStr.startsWith("{")) {
    try {
      const parsed = JSON.parse(natalChartStr);
      const fromChart = parseAscendant(parsed.ascendant);
      if (fromChart) ascendant = fromChart;
      chartText =
        typeof parsed.natalChart === "string" ? parsed.natalChart.trim() : "";
    } catch {
      chartText = natalChartStr;
    }
  }

  if (ascendant || chartText) {
    return {
      ascendant: ascendant || { sign: "", description: "" },
      natalChart: chartText,
    };
  }
  return null;
}

export default function Profile({ onBack, onNavigate }) {
  const { natalResult, clearJustCalculated, startCalculation, isCalculating } =
    useNatalChart();
  const user = getOnboardingUser();
  const displayNatal = useMemo(
    () => (natalResult ? getDisplayNatal(natalResult) : null),
    [natalResult]
  );
  const [showRecalcForm, setShowRecalcForm] = useState(false);
  const [recalcDate, setRecalcDate] = useState("");
  const [recalcPlace, setRecalcPlace] = useState("");
  const [recalcTime, setRecalcTime] = useState("");
  const [recalcError, setRecalcError] = useState(null);

  useEffect(() => {
    clearJustCalculated();
  }, [clearJustCalculated]);

  const hasUser = user && !user.skipped && user.name;
  const hasNatalData = hasUser && user.dateOfBirth && user.placeOfBirth;
  const statusLabel = hasUser
    ? "Профиль заполнен"
    : user?.skipped
    ? "Без данных рождения"
    : "Не заполнен";

  const handleRecalculate = () => {
    setRecalcError(null);
    const dateOfBirth = recalcDate || user?.dateOfBirth;
    const placeOfBirth = (recalcPlace || user?.placeOfBirth || "").trim();
    if (!dateOfBirth) {
      setRecalcError("Укажи дату рождения");
      return;
    }
    const date = new Date(dateOfBirth);
    if (Number.isNaN(date.getTime()) || date > new Date()) {
      setRecalcError("Проверь дату рождения");
      return;
    }
    if (!placeOfBirth) {
      setRecalcError("Укажи место рождения (город или страна)");
      return;
    }
    const timeOfBirth =
      (recalcTime || user?.timeOfBirth || "").trim() || undefined;
    if (hasUser && (recalcDate || recalcPlace || recalcTime !== undefined)) {
      saveOnboardingUser(
        user.name,
        recalcDate || user.dateOfBirth,
        recalcPlace || user.placeOfBirth,
        recalcTime ?? user?.timeOfBirth ?? ""
      );
    }
    startCalculation(getInitData(), { dateOfBirth, placeOfBirth, timeOfBirth });
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
        <h1>Личный кабинет</h1>
      </header>

      <main className="profile-main">
        <section
          className="profile-section card"
          data-aos="fade-up"
        >
          <h2 className="profile-section-title">Статус</h2>
          <p className="profile-status">
            <span
              className={`profile-status-dot ${hasUser ? "filled" : "skipped"}`}
            />
            {statusLabel}
          </p>
          {hasUser && (
            <p className="profile-subtext">
              {user.name}
              {user.dateOfBirth && (
                <> · {new Date(user.dateOfBirth).toLocaleDateString("ru-RU")}</>
              )}
              {user.timeOfBirth && <> · {user.timeOfBirth}</>}
            </p>
          )}
        </section>

        {displayNatal && (
          <>
            <section
              className="profile-section card"
              data-aos="fade-up"
              data-aos-delay="50"
            >
              <h2 className="profile-section-title">Асцендент</h2>
              {displayNatal.ascendant &&
              typeof displayNatal.ascendant === "object" &&
              (displayNatal.ascendant.sign ||
                displayNatal.ascendant.description) ? (
                <>
                  {displayNatal.ascendant.sign && (
                    <p className="profile-ascendant-sign">
                      {displayNatal.ascendant.sign}
                    </p>
                  )}
                  <p className="profile-natal-text">
                    {displayNatal.ascendant.description ||
                      displayNatal.ascendant.sign}
                  </p>
                </>
              ) : (
                <p className="profile-natal-text">
                  {typeof displayNatal.ascendant === "string"
                    ? displayNatal.ascendant
                    : ""}
                </p>
              )}
            </section>
            {displayNatal.natalChart ? (
              <section
                className="profile-section card"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                <h2 className="profile-section-title">Натальная карта</h2>
                <p className="profile-natal-text profile-natal-chart">
                  {renderTextWithBold(displayNatal.natalChart)}
                </p>
              </section>
            ) : null}
            <section
              className="profile-section card profile-tarot-card-debug"
              data-aos="fade-up"
              data-aos-delay="120"
            >
              <h2 className="profile-section-title">Карта Таро</h2>
              <img
                src={getTarotCardImageForNatal(displayNatal)}
                alt="Карта Таро по расчёту"
                className="profile-tarot-card-image"
              />
            </section>
            <div
              className="profile-natal-notice card"
              data-aos="fade-up"
              data-aos-delay="150"
            >
              <p className="profile-natal-notice-text">
                {user?.name ? (
                  <>
                    {user.name}, это базовый расчёт по дате и месту. Полный
                    разбор с тарологом — в разделе «Все расклады».
                  </>
                ) : (
                  <>
                    Это базовый расчёт по дате и месту. Полный разбор с
                    тарологом — в разделе «Все расклады».
                  </>
                )}
              </p>
              <button
                type="button"
                className="btn btn-outline profile-natal-notice-btn"
                onClick={() => onNavigate(ScreenId.ALL_SPREADS)}
              >
                Все расклады → Натальная карта
              </button>
            </div>
          </>
        )}

        <section
          className="profile-section card profile-natal-recalc"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <h2 className="profile-section-title">Асцендент и натальная карта</h2>
          {natalResult && !showRecalcForm && (
            <button
              type="button"
              className="btn btn-outline profile-recalc-btn"
              onClick={() => {
                setShowRecalcForm(true);
                setRecalcDate(user?.dateOfBirth || "");
                setRecalcPlace(user?.placeOfBirth || "");
                setRecalcTime(user?.timeOfBirth || "");
              }}
            >
              Повторный расчёт
            </button>
          )}
          {!natalResult && !hasNatalData && !showRecalcForm && (
            <>
              <p className="profile-subtitle">
                Укажи дату и место рождения — рассчитаем асцендент и натальную
                карту. Результат появится выше.
              </p>
              <button
                type="button"
                className="btn btn-outline profile-recalc-btn"
                onClick={() => {
                  setShowRecalcForm(true);
                  setRecalcDate(user?.dateOfBirth || "");
                  setRecalcPlace(user?.placeOfBirth || "");
                  setRecalcTime(user?.timeOfBirth || "");
                }}
              >
                Указать данные и рассчитать
              </button>
            </>
          )}
          {(showRecalcForm || (!natalResult && hasNatalData)) && (
            <>
              <div className="profile-recalc-fields">
                <label className="review-label">
                  <span className="subtitle">Дата рождения</span>
                  <input
                    type="date"
                    className="review-textarea onboarding-input"
                    value={recalcDate || user?.dateOfBirth || ""}
                    onChange={(e) => setRecalcDate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                  />
                </label>
                <label className="review-label">
                  <span className="subtitle">Время рождения</span>
                  <input
                    type="time"
                    className="review-textarea onboarding-input"
                    value={recalcTime || user?.timeOfBirth || ""}
                    onChange={(e) => setRecalcTime(e.target.value)}
                  />
                </label>
                <label className="review-label">
                  <span className="subtitle">
                    Место рождения (город или страна)
                  </span>
                  <input
                    type="text"
                    className="review-textarea onboarding-input"
                    value={recalcPlace || user?.placeOfBirth || ""}
                    onChange={(e) => setRecalcPlace(e.target.value)}
                    placeholder="Например: Москва"
                  />
                </label>
              </div>
              {recalcError && (
                <p
                  className="free-tarot-error"
                  role="alert"
                >
                  {recalcError}
                </p>
              )}
              <button
                type="button"
                className="btn btn-primary profile-recalc-btn"
                disabled={isCalculating}
                onClick={handleRecalculate}
              >
                {isCalculating
                  ? "Рассчитываем…"
                  : natalResult
                  ? "Пересчитать заново"
                  : "Рассчитать"}
              </button>
            </>
          )}
        </section>

        <section
          className="profile-section"
          data-aos="fade-up"
          data-aos-delay="150"
        >
          <h2 className="profile-section-title">Расклады</h2>
          <button
            type="button"
            className="menu-card profile-menu-card"
            onClick={() => onNavigate("my-readings")}
          >
            <span className="menu-icon">📂</span>
            <div className="menu-text">
              <span className="menu-title">Мои расклады</span>
              <span className="menu-desc">История и активные заказы</span>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
}
