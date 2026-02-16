import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import TarotShuffleLoader from "../components/TarotShuffleLoader";
import { useCardDayRequest } from "../context/CardDayRequestContext";
import { useNatalChart } from "../context/NatalChartContext";
import { getOnboardingUser } from "./Onboarding";
import { getInitData } from "../utils/telegram";
import {
  getNatalForCardDay,
  hasNatalForCardDay,
  getDisplayNatal,
} from "../utils/natal";
import { getCardImageForCardDay } from "../constants/tarotCards";
import { renderTextWithBold } from "../utils/format";
import { parseJsonSafe } from "../utils/json";
import { getApiUrl } from "../config/api";
import { ScreenId } from "../constants/screens";

export default function CardDayRequest({ onBack, onNavigate }) {
  const {
    setRequesting,
    setJustCardDayDone,
    setHasCardOfTheDay,
    setCardOfTheDay,
  } = useCardDayRequest();
  const { startCalculation, isCalculating, natalResult } = useNatalChart();
  const user = getOnboardingUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [card, setCard] = useState(null); // { text, expiresAt, dateKey }
  const [requestingNatal, setRequestingNatal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const inTelegram =
        typeof window !== "undefined" && window.Telegram?.WebApp;
      try {
        // 1. Сначала проверяем: есть ли уже карта дня
        const initDataForRequest = inTelegram
          ? getInitData()
          : getInitData() || "";
        const getRes = await fetch(`${getApiUrl()}/api/card-of-the-day/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData: initDataForRequest }),
        });
        const rawText = await getRes.text();
        const getData = parseJsonSafe(rawText);
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
        if (!getRes.ok) {
          const rawPreview =
            typeof rawText === "string" ? rawText.slice(0, 500) : "(нет тела)";
          console.error(
            "[Карта дня] Статус:",
            getRes.status,
            "| error из JSON:",
            getData?.error ?? "(нет)",
            "| RAW тело ответа:",
            rawPreview || "(пусто)"
          );
          const serverError = getData?.error || "";
          if (
            getRes.status === 400 &&
            serverError.toLowerCase().includes("initdata") &&
            !inTelegram
          ) {
            setError(
              "Локально в браузере нужен API в режиме разработки: в одном терминале запусти npm run dev:api, в .env задай DEV_USER_ID (число). Подробнее: docs/DEV.md"
            );
          } else if (
            (getRes.status === 500 || getRes.status === 401) &&
            !inTelegram
          ) {
            setError(
              serverError
                ? `${serverError} Локально: запусти API через npm run dev:api и задай DEV_USER_ID в .env (docs/DEV.md).`
                : "Ошибка загрузки. Локально: запусти npm run dev:api и задай DEV_USER_ID в .env (docs/DEV.md)."
            );
          } else {
            setError(
              serverError ||
                "Ошибка загрузки. Попробуй позже или открой из Telegram."
            );
          }
          setLoading(false);
          setRequestingNatal(false);
          return;
        }

        // 2. Карты нет — проверяем натальные данные
        await new Promise((r) => setTimeout(r, 50));
        if (cancelled) return;

        let displayNatal = natalResult
          ? getDisplayNatal(natalResult)
          : getNatalForCardDay();
        if (!displayNatal) {
          await new Promise((r) => setTimeout(r, 150));
          if (cancelled) return;
          displayNatal = natalResult
            ? getDisplayNatal(natalResult)
            : getNatalForCardDay();
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
          setError(
            "Для карты дня нужны дата и место рождения. Заполни данные в личном кабинете."
          );
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
          const res = await fetch(`${getApiUrl()}/api/card-of-the-day`, {
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
          const c = {
            text: data.text,
            expiresAt: data.expiresAt,
            dateKey: data.dateKey,
          };
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
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setRequestingNatal(false);
        setError(
          !inTelegram &&
            (err?.message?.includes("Failed to fetch") ||
              err?.code === "ECONNREFUSED")
            ? "API не запущен. В отдельном терминале выполни: npm run dev:api"
            : "Ошибка сети. Попробуй позже."
        );
      }
    };
    run();
    return () => {
      cancelled = true;
      setRequesting(false);
    };
  }, [
    user?.name,
    user?.dateOfBirth,
    user?.placeOfBirth,
    natalResult,
    isCalculating,
    startCalculation,
    setRequesting,
    setJustCardDayDone,
    setHasCardOfTheDay,
    setCardOfTheDay,
  ]);

  const cardImage = card ? getCardImageForCardDay(card.text) : null;

  return (
    <div className="screen screen-card-day-request">
      <header className="header header-compact">
        <button
          type="button"
          className="btn-back"
          onClick={onBack}
        >
          ←
        </button>
        <h1>Карта дня</h1>
      </header>
      <main className="card-day-request-main">
        {(loading || requestingNatal) && (
          <>
            <div className="card-day-request-spinner">
              <TarotShuffleLoader
                size={72}
                aria-label="Загрузка"
              />
            </div>
            <p
              className="card-day-request-notice"
              role="status"
            >
              {requestingNatal
                ? "Идёт расчёт асцендента и натальной карты…"
                : "Можно не ждать загрузки — карта дня появится в личном кабинете. Действует до 24:00."}
            </p>
          </>
        )}
        {error && !loading && !requestingNatal && (
          <div className="card-day-request-error card">
            <p
              className="card-day-request-error-text"
              role="alert"
            >
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
          <motion.div
            className="card-day-result card"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <p className="profile-card-of-the-day-expiry">
              Действует до 24:00 (по Москве)
            </p>
            {cardImage && (
              <motion.div
                className="card-day-result-image-wrap"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, duration: 0.35 }}
              >
                <img
                  src={cardImage}
                  alt="Карта дня"
                  className="card-day-result-image"
                />
              </motion.div>
            )}
            <p className="profile-card-of-the-day-text card-day-result-text">
              {renderTextWithBold(card.text)}
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
}
