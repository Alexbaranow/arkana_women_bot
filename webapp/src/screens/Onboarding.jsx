import { useState } from "react";
import { getInitData } from "../utils/telegram";
import { useNatalChart } from "../context/NatalChartContext";

const STORAGE_KEY = "arkana_user";

export function saveOnboardingUser(name, dateOfBirth, placeOfBirth) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        name: name.trim(),
        dateOfBirth,
        placeOfBirth: placeOfBirth?.trim() || "",
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
    if (!dateOfBirth) {
      setError("Укажи дату рождения");
      return;
    }
    const date = new Date(dateOfBirth);
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
    if (saveOnboardingUser(trimmedName, dateOfBirth, placeOfBirth.trim())) {
      startCalculation(getInitData(), {
        dateOfBirth,
        placeOfBirth: placeOfBirth.trim(),
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
                type="date"
                className="review-textarea onboarding-input"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
              />
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
