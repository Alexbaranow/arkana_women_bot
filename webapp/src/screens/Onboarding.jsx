import { useState, useMemo } from "react";
import { getInitData } from "../utils/telegram";
import { useNatalChart } from "../context/NatalChartContext";

const MONTH_NAMES_RU = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1920;
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_YEAR + 1 }, (_, i) => CURRENT_YEAR - i);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = MONTH_NAMES_RU.map((name, i) => ({ value: i + 1, name }));
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

function toDateInputValue(str) {
  if (!str || typeof str !== "string") return "";
  const s = str.trim();
  if (!s) return "";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

/** Парсит YYYY-MM-DD в { day, month, year } (month 1-12) */
function parseDateParts(str) {
  const s = toDateInputValue(str || "");
  if (!s) return { day: "", month: "", year: "" };
  const [y, m, d] = s.split("-").map(Number);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return { day: "", month: "", year: "" };
  return { day: d, month: m, year: y };
}

/** Собирает day, month, year в YYYY-MM-DD */
function toDateString(day, month, year) {
  if (day === "" || month === "" || year === "") return "";
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return "";
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return "";
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Парсит HH:mm в { hour, minute }; пустая строка = не указано */
function parseTimeParts(str) {
  if (str == null || String(str).trim() === "") return { hour: "", minute: "" };
  const s = String(str).trim();
  if (!/^\d{1,2}:\d{2}$/.test(s)) return { hour: "", minute: "" };
  const [h, m] = s.split(":").map(Number);
  return { hour: h, minute: m };
}

function toTimeString(hour, minute) {
  if (hour === "") return "";
  const h = Number(hour);
  const m = minute === "" ? 0 : Number(minute);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
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

  const dateParts = useMemo(() => parseDateParts(dateOfBirth), [dateOfBirth]);
  const timeParts = useMemo(() => parseTimeParts(timeOfBirth), [timeOfBirth]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Введи, пожалуйста, как к тебе обращаться");
      return;
    }
    const dateStr = toDateInputValue(dateOfBirth) || dateOfBirth;
    if (!dateStr) {
      setError("Укажи дату рождения");
      return;
    }
    const date = new Date(dateStr);
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
    const savedDate = toDateInputValue(dateOfBirth) || dateOfBirth;
    if (
      saveOnboardingUser(
        trimmedName,
        savedDate,
        placeOfBirth.trim(),
        timeOfBirth.trim()
      )
    ) {
      startCalculation(getInitData(), {
        dateOfBirth: savedDate,
        placeOfBirth: placeOfBirth.trim(),
        timeOfBirth: timeOfBirth.trim() || undefined,
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
              <div className="onboarding-date-row">
                <select
                  className="onboarding-select"
                  value={dateParts.day}
                  onChange={(e) => {
                    const day = e.target.value === "" ? "" : Number(e.target.value);
                    setDateOfBirth(toDateString(day, dateParts.month, dateParts.year));
                  }}
                  aria-label="День"
                >
                  <option value="">День</option>
                  {DAYS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <select
                  className="onboarding-select"
                  value={dateParts.month}
                  onChange={(e) => {
                    const month = e.target.value === "" ? "" : Number(e.target.value);
                    setDateOfBirth(toDateString(dateParts.day, month, dateParts.year));
                  }}
                  aria-label="Месяц"
                >
                  <option value="">Месяц</option>
                  {MONTHS.map(({ value, name }) => (
                    <option key={value} value={value}>{name}</option>
                  ))}
                </select>
                <select
                  className="onboarding-select"
                  value={dateParts.year}
                  onChange={(e) => {
                    const year = e.target.value === "" ? "" : Number(e.target.value);
                    setDateOfBirth(toDateString(dateParts.day, dateParts.month, year));
                  }}
                  aria-label="Год"
                >
                  <option value="">Год</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </label>
            <label
              className="review-label"
              style={{ marginTop: "16px" }}
            >
              <span className="subtitle">Время рождения</span>
              <div className="onboarding-date-row">
                <select
                  className="onboarding-select"
                  value={timeParts.hour}
                  onChange={(e) => {
                    const hour = e.target.value === "" ? "" : Number(e.target.value);
                    setTimeOfBirth(toTimeString(hour, timeParts.minute));
                  }}
                  aria-label="Час"
                >
                  <option value="">—</option>
                  {HOURS.map((h) => (
                    <option key={h} value={h}>{String(h).padStart(2, "0")}</option>
                  ))}
                </select>
                <select
                  className="onboarding-select"
                  value={timeParts.minute}
                  onChange={(e) => {
                    const minute = e.target.value === "" ? "" : Number(e.target.value);
                    setTimeOfBirth(toTimeString(timeParts.hour, minute));
                  }}
                  aria-label="Минута"
                >
                  <option value="">—</option>
                  {MINUTES.map((m) => (
                    <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                  ))}
                </select>
              </div>
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
            disabled={!name.trim() || !dateOfBirth || !placeOfBirth.trim()}
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
