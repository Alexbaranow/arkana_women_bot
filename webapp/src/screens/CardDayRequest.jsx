import { useEffect, useState } from "react";
import { MoonLoader } from "react-spinners";
import { getOnboardingUser } from "./Onboarding";
import { getInitData } from "../utils/telegram";
import { getNatalForCardDay, hasNatalForCardDay } from "../utils/natal";
import { ScreenId } from "../constants/screens";

const API_URL = import.meta.env.VITE_API_URL || "";
const ERROR_NEED_NATAL =
  "Для более точной карты дня сначала рассчитай асцендент и натальную карту в личном кабинете (раздел «Асцендент и натальная карта»).";

export default function CardDayRequest({ onBack, onNavigate }) {
  const user = getOnboardingUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled) return;

      let displayNatal = getNatalForCardDay();
      if (!displayNatal) {
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
        displayNatal = getNatalForCardDay();
      }

      if (!hasNatalForCardDay(displayNatal)) {
        if (!cancelled) {
          setError(ERROR_NEED_NATAL);
          setLoading(false);
        }
        return;
      }

      const ascendant = displayNatal.ascendant;
      const natalChart = displayNatal.natalChart?.trim() ?? "";

      try {
        const res = await fetch(`${API_URL}/api/card-of-the-day`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            initData: getInitData(),
            userName: user?.name?.trim() || null,
            ascendant: ascendant || null,
            natalChart: natalChart || null,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || ERROR_NEED_NATAL);
          setLoading(false);
          return;
        }
        onNavigate(ScreenId.PROFILE);
      } catch {
        if (!cancelled) {
          setError("Ошибка сети. Попробуй ещё раз.");
          setLoading(false);
        }
      }
    };
    run();
    return () => { cancelled = true; };
  }, [user?.name, onNavigate]);

  return (
    <div className="screen screen-card-day-request">
      <header className="header header-compact">
        <button type="button" className="btn-back" onClick={onBack}>
          ←
        </button>
        <h1>Карта дня</h1>
      </header>
      <main className="card-day-request-main">
        {loading && (
          <>
            <div className="card-day-request-spinner">
              <MoonLoader
                color="var(--color-primary, #7c3aed)"
                size={56}
                speedMultiplier={0.9}
                aria-label="Загрузка"
              />
            </div>
            <p className="card-day-request-notice" role="status">
              Можно не ждать загрузки — карта дня появится в личном кабинете.
              Действует до 24:00.
            </p>
          </>
        )}
        {error && !loading && (
          <div className="card-day-request-error card">
            <p className="card-day-request-error-text" role="alert">
              {error}
            </p>
            <p className="card-day-request-error-hint">
              Рассчитай асцендент и натальную карту в личном кабинете — тогда
              карта дня будет персональной и точнее.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onNavigate(ScreenId.PROFILE)}
            >
              Перейти в личный кабинет
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ marginTop: "8px" }}
              onClick={onBack}
            >
              Назад
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
