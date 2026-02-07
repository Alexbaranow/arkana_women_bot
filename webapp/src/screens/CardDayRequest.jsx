import { useEffect, useState } from "react";
import { MoonLoader } from "react-spinners";
import { useCardDayRequest } from "../context/CardDayRequestContext";
import { useNatalChart } from "../context/NatalChartContext";
import { getOnboardingUser } from "./Onboarding";
import { getInitData } from "../utils/telegram";
import { getNatalForCardDay, hasNatalForCardDay, getDisplayNatal } from "../utils/natal";
import { getCardImageForCardDay } from "../constants/tarotCards";
import { renderTextWithBold } from "../utils/format";
import { ScreenId } from "../constants/screens";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function CardDayRequest({ onBack, onNavigate }) {
  const { setRequesting, setJustCardDayDone, setHasCardOfTheDay, setCardOfTheDay } = useCardDayRequest();
  const { startCalculation, isCalculating, natalResult } = useNatalChart();
  const user = getOnboardingUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [card, setCard] = useState(null); // { text, expiresAt, dateKey }
  const [requestingNatal, setRequestingNatal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 1. Сначала проверяем: есть ли уже карта дня
      const getRes = await fetch(`${API_URL}/api/card-of-the-day/get`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData: getInitData() }),
      });
      const getData = await getRes.json().catch(() => ({}));
      if (cancelled) return;
      if (getData.ok && getData.card?.text) {
        const c = getData.card;
        setCard(c);
        setHasCardOfTheDay(true);
        setCardOfTheDay(c);
        setLoading(false);
        setRequestingNatal(false);
        return;
      }

      // 2. Карты нет — проверяем натальные данные
      await new Promise((r) => setTimeout(r, 50));
      if (cancelled) return;

      let displayNatal = natalResult ? getDisplayNatal(natalResult) : getNatalForCardDay();
      if (!displayNatal) {
        await new Promise((r) => setTimeout(r, 150));
        if (cancelled) return;
        displayNatal = natalResult ? getDisplayNatal(natalResult) : getNatalForCardDay();
      }

      if (!hasNatalForCardDay(displayNatal)) {
        // Есть данные пользователя — запускаем расчёт асцендента и натальной карты (или ждём, если уже идёт)
        if (user?.dateOfBirth && user?.placeOfBirth) {
          setRequestingNatal(true);
          setError(null);
          if (!isCalculating) {
            startCalculation(getInitData(), {
              dateOfBirth: user.dateOfBirth,
              placeOfBirth: user.placeOfBirth,
              timeOfBirth: user.timeOfBirth || undefined,
            });
          }
          setLoading(false);
          return;
        }
        setError("Для карты дня нужны дата и место рождения. Заполни данные в личном кабинете.");
        setLoading(false);
        setRequestingNatal(false);
        return;
      }

      setRequestingNatal(false);
      setLoading(true);
      const ascendant = displayNatal.ascendant;
      const natalChart = displayNatal.natalChart?.trim() ?? "";
      const body = {
        initData: getInitData(),
        userName: user?.name?.trim() || null,
        ascendant: ascendant || null,
        natalChart: natalChart || null,
      };

      setRequesting(true);
      try {
        const res = await fetch(`${API_URL}/api/card-of-the-day`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error || "Не удалось получить карту дня.");
          setLoading(false);
          return;
        }
        setRequesting(false);
        setJustCardDayDone(true);
        const c = { text: data.text, expiresAt: data.expiresAt, dateKey: data.dateKey };
        setCard(c);
        setHasCardOfTheDay(true);
        setCardOfTheDay(c);
        setLoading(false);
      } catch {
        if (!cancelled) {
          setError("Ошибка сети. Попробуй ещё раз.");
          setLoading(false);
        }
        setRequesting(false);
      }
    };
    run();
    return () => {
      cancelled = true;
      setRequesting(false);
    };
  }, [user?.name, user?.dateOfBirth, user?.placeOfBirth, natalResult, isCalculating, startCalculation, setRequesting, setJustCardDayDone, setHasCardOfTheDay, setCardOfTheDay]);

  const cardImage = card ? getCardImageForCardDay(card.text) : null;

  return (
    <div className="screen screen-card-day-request">
      <header className="header header-compact">
        <button type="button" className="btn-back" onClick={onBack}>
          ←
        </button>
        <h1>Карта дня</h1>
      </header>
      <main className="card-day-request-main">
        {(loading || requestingNatal) && (
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
              {requestingNatal
                ? "Идёт расчёт асцендента и натальной карты…"
                : "Можно не ждать загрузки — карта дня появится в личном кабинете. Действует до 24:00."}
            </p>
          </>
        )}
        {error && !loading && !requestingNatal && (
          <div className="card-day-request-error card">
            <p className="card-day-request-error-text" role="alert">
              {error}
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
        {card && !loading && (
          <div className="card-day-result card">
            <p className="profile-card-of-the-day-expiry">
              Действует до 24:00 (по Москве)
            </p>
            {cardImage && (
              <div className="card-day-result-image-wrap">
                <img
                  src={cardImage}
                  alt="Карта дня"
                  className="card-day-result-image"
                />
              </div>
            )}
            <p className="profile-card-of-the-day-text card-day-result-text">
              {renderTextWithBold(card.text)}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
