import { useState, useRef, useEffect } from "react";
import { getInitData } from "../utils/telegram";
import { useNatalChart } from "../context/NatalChartContext";

/** В поле даты — только цифры и разделители . / - */
function filterDateInput(value) {
  return value.replace(/[^\d./\-]/g, "");
}

/** В поле времени — только цифры и : . */
function filterTimeInput(value) {
  return value.replace(/[^\d.:]/g, "");
}

/** В текстовых полях (имя, место) — только буквы, пробелы и дефис */
function filterLettersInput(value) {
  return value.replace(/[^\p{L}\s\-]/gu, "");
}

/** Парсит ввод пользователя (ДД.ММ.ГГГГ, ДД/ММ/ГГГГ, ГГГГ-ММ-ДД) в YYYY-MM-DD */
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

/** Парсит ввод времени (ЧЧ:ММ, ЧЧ.ММ, ЧЧ ММ) в HH:mm */
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

const STORAGE_KEY = "arkana_user";

export function saveOnboardingUser(
  name,
  dateOfBirth,
  placeOfBirth,
  timeOfBirth = ""
) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: name.trim(),
        dateOfBirth,
        placeOfBirth: placeOfBirth?.trim() || "",
        timeOfBirth: typeof timeOfBirth === "string" ? timeOfBirth.trim() : "",
      })
    );
    return true;
  } catch {
    return false;
  }
}

export function saveOnboardingSkipped() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ skipped: true }));
    return true;
  } catch {
    return false;
  }
}

export function getOnboardingUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.skipped) return { skipped: true };
    return data?.name && data?.dateOfBirth && data?.placeOfBirth ? data : null;
  } catch {
    return null;
  }
}

/** Пользователь либо заполнил данные, либо отказался от ввода (пропустил) — в обоих случаях не показываем онбординг снова */
export function isUserRegistered() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (data?.skipped) return true;
    return !!(data?.name && data?.dateOfBirth && data?.placeOfBirth);
  } catch {
    return false;
  }
}

export default function Onboarding({ onBack, onComplete }) {
  const { startCalculation } = useNatalChart();
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [timeOfBirth, setTimeOfBirth] = useState("");
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const nameRef = useRef(null);
  const dateRef = useRef(null);
  const timeRef = useRef(null);
  const placeRef = useRef(null);

  useEffect(() => {
    const order = ["name", "dateOfBirth", "timeOfBirth", "placeOfBirth"];
    const firstKey = order.find((key) => fieldErrors[key]);
    if (!firstKey) return;
    const refMap = { name: nameRef, dateOfBirth: dateRef, timeOfBirth: timeRef, placeOfBirth: placeRef };
    const ref = refMap[firstKey];
    ref?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => ref?.current?.focus(), 300);
  }, [fieldErrors]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const savedDate = parseUserDateInput(dateOfBirth);
    const date = savedDate ? new Date(savedDate) : null;
    const trimmedPlace = placeOfBirth.trim();

    const errors = {};
    if (!trimmedName) errors.name = true;
    if (!savedDate || !date || Number.isNaN(date.getTime()) || date > new Date()) {
      errors.dateOfBirth = true;
    }
    if (!timeUnknown && timeOfBirth.trim() && !parseUserTimeInput(timeOfBirth)) {
      errors.timeOfBirth = true;
    }
    if (!trimmedPlace) errors.placeOfBirth = true;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.name) setError("Введи, пожалуйста, как к тебе обращаться");
      else if (errors.dateOfBirth) setError("Укажи дату рождения (например 16.02.1992)");
      else if (errors.timeOfBirth) setError("Время укажи в формате ЧЧ:ММ (например 16:30)");
      else setError("Укажи место рождения (город или страна)");
      return;
    }

    setFieldErrors({});
    const savedTime = timeUnknown ? "" : parseUserTimeInput(timeOfBirth);
    if (
      saveOnboardingUser(trimmedName, savedDate, trimmedPlace, savedTime)
    ) {
      startCalculation(getInitData(), {
        dateOfBirth: savedDate,
        placeOfBirth: trimmedPlace,
        timeOfBirth: savedTime || undefined,
      });
      onComplete?.();
    } else {
      setError("Не удалось сохранить. Попробуй ещё раз.");
    }
  };

  const handleSkip = () => {
    if (saveOnboardingSkipped()) {
      onComplete?.();
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
        <h1>Немного о тебе</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div
            className="card"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p
              className="subtitle onboarding-note"
              style={{ marginBottom: "20px" }}
            >
              Это нужно для определения асцендента, натальной карты и более
              точного прогноза ✨ Асцендент и натальную карту можно будет
              рассчитать или пересчитать в личном кабинете в любое время.
            </p>
            {error && (
              <p
                className="free-tarot-error"
                role="alert"
                style={{ marginBottom: "12px" }}
              >
                {error}
              </p>
            )}
            <label className="review-label">
              <span className="subtitle">Как к тебе обращаться?</span>
              <input
                ref={nameRef}
                type="text"
                className={`review-textarea onboarding-input ${fieldErrors.name ? "input-invalid" : ""}`}
                value={name}
                onChange={(e) => {
                  setName(filterLettersInput(e.target.value));
                  if (fieldErrors.name) setFieldErrors((p) => ({ ...p, name: false }));
                }}
                placeholder="Имя"
                autoComplete="name"
              />
            </label>
            <label
              className="review-label"
              style={{ marginTop: "16px" }}
            >
              <span className="subtitle">Дата рождения</span>
              <input
                ref={dateRef}
                type="text"
                className={`review-textarea onboarding-input ${fieldErrors.dateOfBirth ? "input-invalid" : ""}`}
                value={/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? formatDateForInput(dateOfBirth) : dateOfBirth}
                onChange={(e) => {
                  setDateOfBirth(filterDateInput(e.target.value));
                  if (fieldErrors.dateOfBirth) setFieldErrors((p) => ({ ...p, dateOfBirth: false }));
                }}
                placeholder="ДД.ММ.ГГГГ (например 16.02.1992)"
                autoComplete="bday"
              />
            </label>
            <label
              className="review-label"
              style={{ marginTop: "16px" }}
            >
              <span className="subtitle">Время рождения</span>
              {!timeUnknown && (
                <input
                  ref={timeRef}
                  type="text"
                  className={`review-textarea onboarding-input ${fieldErrors.timeOfBirth ? "input-invalid" : ""}`}
                  value={timeOfBirth}
                  onChange={(e) => {
                    setTimeOfBirth(filterTimeInput(e.target.value));
                    if (fieldErrors.timeOfBirth) setFieldErrors((p) => ({ ...p, timeOfBirth: false }));
                  }}
                  placeholder="ЧЧ:ММ (например 16:30)"
                  autoComplete="off"
                />
              )}
              <label className="onboarding-checkbox-label">
                <input
                  type="checkbox"
                  className="onboarding-checkbox"
                  checked={timeUnknown}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setTimeUnknown(checked);
                    if (checked) {
                      setTimeOfBirth("");
                      setFieldErrors((p) => ({ ...p, timeOfBirth: false }));
                    }
                  }}
                />
                <span className="onboarding-checkbox-text">Не знаю</span>
              </label>
              <span
                className="subtitle"
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                Нужно для точного расчёта асцендента и натальной карты.
              </span>
            </label>
            <label
              className="review-label"
              style={{ marginTop: "16px" }}
            >
              <span className="subtitle">
                Место рождения (город или страна)
              </span>
              <input
                ref={placeRef}
                type="text"
                className={`review-textarea onboarding-input ${fieldErrors.placeOfBirth ? "input-invalid" : ""}`}
                value={placeOfBirth}
                onChange={(e) => {
                  setPlaceOfBirth(filterLettersInput(e.target.value));
                  if (fieldErrors.placeOfBirth) setFieldErrors((p) => ({ ...p, placeOfBirth: false }));
                }}
                placeholder="Например: Москва или Россия"
                autoComplete="off"
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            data-aos="fade-up"
            data-aos-delay="150"
          >
            Продолжить
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleSkip}
            style={{ marginTop: "8px" }}
            data-aos="fade-up"
            data-aos-delay="180"
          >
            Не указывать — продолжить без этого
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBack}
            style={{ marginTop: "8px" }}
            data-aos="fade-up"
            data-aos-delay="200"
          >
            ← Назад
          </button>
        </form>
      </main>
    </div>
  );
}
