import { useEffect, useState, useMemo, useRef } from "react";
import { useNatalChart } from "../context/NatalChartContext";
import { getOnboardingUser, saveOnboardingUser } from "./Onboarding";
import { getInitData } from "../utils/telegram";
import { ScreenId } from "../constants/screens";
import { getTarotCardImageForNatal } from "../constants/tarotCards";

/** В поле даты — только цифры, точки подставляются автоматически (ДД.ММ.ГГГГ) */
function formatDateInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
}

/** В поле времени — только цифры, двоеточие подставляется автоматически (ЧЧ:ММ) */
function formatTimeInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

/** В текстовых полях — только буквы, пробелы и дефис */
function filterLettersInput(value) {
  return value.replace(/[^\p{L}\s\-]/gu, "");
}

/** Парсит ввод даты (ДД.ММ.ГГГГ, ДД/ММ/ГГГГ, ГГГГ-ММ-ДД) в YYYY-MM-DD */
function parseUserDateInput(str) {
  if (!str || typeof str !== "string") return "";
  const s = str.trim().replace(/\s+/g, " ");
  if (!s) return "";
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  }
  const parts = s.split(/[.\-/]/).map((p) => p.trim()).filter(Boolean);
  if (parts.length !== 3) return "";
  let day, month, year;
  if (parts[0].length === 4 && parts[1].length <= 2 && parts[2].length <= 2) {
    year = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    day = parseInt(parts[2], 10);
  } else if (parts[2].length === 4 && parts[0].length <= 2 && parts[1].length <= 2) {
    day = parseInt(parts[0], 10);
    month = parseInt(parts[1], 10);
    year = parseInt(parts[2], 10);
  } else return "";
  if (Number.isNaN(day) || Number.isNaN(month) || Number.isNaN(year)) return "";
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** YYYY-MM-DD → ДД.ММ.ГГГГ для отображения в поле */
function formatDateForInput(str) {
  if (!str || typeof str !== "string") return "";
  const s = str.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split("-");
  return `${d}.${m}.${y}`;
}

/** Парсит ввод времени (ЧЧ:ММ и т.п.) в HH:mm */
function parseUserTimeInput(str) {
  if (str == null || typeof str !== "string") return "";
  const s = String(str).trim();
  if (!s) return "";
  const normalized = s.replace(".", ":").replace(/\s+/, ":");
  const match = normalized.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return "";
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

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
  const [recalcTimeUnknown, setRecalcTimeUnknown] = useState(false);
  const [recalcError, setRecalcError] = useState(null);
  const [recalcFieldErrors, setRecalcFieldErrors] = useState({});
  const recalcDateRef = useRef(null);
  const recalcTimeRef = useRef(null);
  const recalcPlaceRef = useRef(null);

  const prevCalculating = useRef(isCalculating);

  useEffect(() => {
    const order = ["dateOfBirth", "timeOfBirth", "placeOfBirth"];
    const firstKey = order.find((k) => recalcFieldErrors[k]);
    if (!firstKey) return;
    const refMap = { dateOfBirth: recalcDateRef, timeOfBirth: recalcTimeRef, placeOfBirth: recalcPlaceRef };
    const ref = refMap[firstKey];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => ref?.current?.focus(), 300);
  }, [recalcFieldErrors]);

  useEffect(() => {
    clearJustCalculated();
  }, [clearJustCalculated]);

  // После завершения пересчёта снова прячем меню ввода данных (как на экране с кнопкой «Повторный расчёт»)
  useEffect(() => {
    if (prevCalculating.current && !isCalculating) {
      setShowRecalcForm(false);
    }
    prevCalculating.current = isCalculating;
  }, [isCalculating]);

  const hasUser = user && !user.skipped && user.name;
  const hasNatalData = hasUser && user.dateOfBirth && user.placeOfBirth;
  const statusLabel = hasUser
    ? "Профиль заполнен"
    : user?.skipped
    ? "Без данных рождения"
    : "Не заполнен";

  const handleRecalculate = () => {
    setRecalcError(null);
    const savedDate = parseUserDateInput(recalcDate) || user?.dateOfBirth || "";
    const placeOfBirth = (recalcPlace || user?.placeOfBirth || "").trim();
    const date = savedDate ? new Date(savedDate) : null;
    const errors = {};
    if (!savedDate || !date || Number.isNaN(date.getTime()) || date > new Date()) {
      errors.dateOfBirth = true;
    }
    if (!recalcTimeUnknown && recalcTime.trim() && !parseUserTimeInput(recalcTime)) {
      errors.timeOfBirth = true;
    }
    if (!placeOfBirth) errors.placeOfBirth = true;
    if (Object.keys(errors).length > 0) {
      setRecalcFieldErrors(errors);
      if (errors.dateOfBirth) setRecalcError("Укажи дату рождения (например 16.02.1992)");
      else if (errors.timeOfBirth) setRecalcError("Время укажи в формате ЧЧ:ММ (например 16:30)");
      else setRecalcError("Укажи место рождения (город или страна)");
      return;
    }
    setRecalcFieldErrors({});
    const timeOfBirth = recalcTimeUnknown ? "" : (parseUserTimeInput(recalcTime) || (user?.timeOfBirth || "").trim() || undefined);
    if (hasUser && (recalcDate || recalcPlace || recalcTime !== undefined || recalcTimeUnknown)) {
      saveOnboardingUser(
        user.name,
        savedDate,
        placeOfBirth,
        recalcTimeUnknown ? "" : (recalcTime || (user?.timeOfBirth ?? ""))
      );
    }
    startCalculation(getInitData(), { dateOfBirth: savedDate, placeOfBirth, timeOfBirth });
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
                onClick={() => onNavigate("natal-chart")}
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
                setRecalcDate(user?.dateOfBirth ? formatDateForInput(user.dateOfBirth) : "");
                setRecalcPlace(user?.placeOfBirth || "");
                setRecalcTime(user?.timeOfBirth || "");
                setRecalcTimeUnknown(false);
                setRecalcFieldErrors({});
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
                  setRecalcDate(user?.dateOfBirth ? formatDateForInput(user.dateOfBirth) : "");
                  setRecalcPlace(user?.placeOfBirth || "");
                  setRecalcTime(user?.timeOfBirth || "");
                  setRecalcTimeUnknown(false);
                  setRecalcFieldErrors({});
                }}
              >
                Указать данные и рассчитать
              </button>
            </>
          )}
          {(showRecalcForm || (!natalResult && hasNatalData)) && (
            <>
              {recalcError && !isCalculating && (
                <p
                  className="free-tarot-error"
                  role="alert"
                  style={{ marginBottom: "12px" }}
                >
                  {recalcError}
                </p>
              )}
              {!isCalculating && (
                <div className="profile-recalc-fields">
                  <label className="review-label">
                    <span className="subtitle">Дата рождения</span>
                    <input
                      ref={recalcDateRef}
                      type="text"
                      className={`profile-recalc-input review-textarea ${recalcFieldErrors.dateOfBirth ? "input-invalid" : ""}`}
                      value={/^\d{4}-\d{2}-\d{2}$/.test(recalcDate) ? formatDateForInput(recalcDate) : recalcDate}
                      onChange={(e) => {
                        setRecalcDate(formatDateInput(e.target.value));
                        if (recalcFieldErrors.dateOfBirth) setRecalcFieldErrors((p) => ({ ...p, dateOfBirth: false }));
                      }}
                      placeholder="ДД.ММ.ГГГГ (например 16.02.1992)"
                    />
                  </label>
                  <label className="review-label">
                    <span className="subtitle">Время рождения</span>
                    {!recalcTimeUnknown && (
                      <input
                        ref={recalcTimeRef}
                        type="text"
                        className={`profile-recalc-input review-textarea ${recalcFieldErrors.timeOfBirth ? "input-invalid" : ""}`}
                        value={recalcTime}
                        onChange={(e) => {
                          setRecalcTime(formatTimeInput(e.target.value));
                          if (recalcFieldErrors.timeOfBirth) setRecalcFieldErrors((p) => ({ ...p, timeOfBirth: false }));
                        }}
                        placeholder="ЧЧ:ММ (например 16:30)"
                      />
                    )}
                    <label className="onboarding-checkbox-label">
                      <input
                        type="checkbox"
                        className="onboarding-checkbox"
                        checked={recalcTimeUnknown}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRecalcTimeUnknown(checked);
                          if (checked) {
                            setRecalcTime("");
                            setRecalcFieldErrors((p) => ({ ...p, timeOfBirth: false }));
                          }
                        }}
                      />
                      <span className="onboarding-checkbox-text">Не знаю</span>
                    </label>
                  </label>
                  <label className="review-label">
                    <span className="subtitle">
                      Место рождения (город или страна)
                    </span>
                    <input
                      ref={recalcPlaceRef}
                      type="text"
                      className={`profile-recalc-input review-textarea ${recalcFieldErrors.placeOfBirth ? "input-invalid" : ""}`}
                      value={recalcPlace}
                      onChange={(e) => {
                        setRecalcPlace(filterLettersInput(e.target.value));
                        if (recalcFieldErrors.placeOfBirth) setRecalcFieldErrors((p) => ({ ...p, placeOfBirth: false }));
                      }}
                      placeholder="Например: Москва"
                    />
                  </label>
                </div>
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
