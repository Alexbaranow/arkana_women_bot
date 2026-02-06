import { useState } from "react";
import { getInitData } from "../utils/telegram";
import { useNatalChart } from "../context/NatalChartContext";

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
  const [placeOfBirth, setPlaceOfBirth] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Введи, пожалуйста, как к тебе обращаться");
      return;
    }
    const savedDate = parseUserDateInput(dateOfBirth);
    if (!savedDate) {
      setError("Укажи дату рождения (например 16.02.1992)");
      return;
    }
    const date = new Date(savedDate);
    if (Number.isNaN(date.getTime()) || date > new Date()) {
      setError("Проверь дату рождения");
      return;
    }
    if (!placeOfBirth.trim()) {
      setError(
        "Укажи место рождения (город или страна) — нужно для расчёта асцендента"
      );
      return;
    }
    const savedTime = parseUserTimeInput(timeOfBirth);
    if (
      saveOnboardingUser(
        trimmedName,
        savedDate,
        placeOfBirth.trim(),
        savedTime
      )
    ) {
      startCalculation(getInitData(), {
        dateOfBirth: savedDate,
        placeOfBirth: placeOfBirth.trim(),
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
            <label className="review-label">
              <span className="subtitle">Как к тебе обращаться?</span>
              <input
                type="text"
                className="review-textarea onboarding-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                type="text"
                className="review-textarea onboarding-input"
                value={/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? formatDateForInput(dateOfBirth) : dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="ДД.ММ.ГГГГ (например 16.02.1992)"
                autoComplete="bday"
              />
            </label>
            <label
              className="review-label"
              style={{ marginTop: "16px" }}
            >
              <span className="subtitle">Время рождения</span>
              <input
                type="text"
                className="review-textarea onboarding-input"
                value={timeOfBirth}
                onChange={(e) => setTimeOfBirth(e.target.value)}
                placeholder="ЧЧ:ММ или пусто (например 16:30)"
                autoComplete="off"
              />
              <span
                className="subtitle"
                style={{
                  fontSize: "12px",
                  color: "var(--color-text-muted)",
                  marginTop: "4px",
                  display: "block",
                }}
              >
                Нужно для точного расчёта асцендента и натальной карты. Если не
                знаешь — оставь пустым.
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
                type="text"
                className="review-textarea onboarding-input"
                value={placeOfBirth}
                onChange={(e) => setPlaceOfBirth(e.target.value)}
                placeholder="Например: Москва или Россия"
                autoComplete="off"
              />
            </label>
            {error && (
              <p
                className="free-tarot-error"
                role="alert"
                style={{ marginTop: "12px" }}
              >
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || !parseUserDateInput(dateOfBirth) || !placeOfBirth.trim()}
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
