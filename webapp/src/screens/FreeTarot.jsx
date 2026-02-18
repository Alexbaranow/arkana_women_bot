import { useState, useEffect } from "react";
import { getOnboardingUser } from "./Onboarding";
import { getInitData, isLocalDev } from "../utils/telegram";
import { getApiUrl } from "../config/api";
import TarotShuffleLoader from "../components/TarotShuffleLoader";

export default function FreeTarot({ onBack }) {
  const user = getOnboardingUser();
  const userName = user?.name && !user?.skipped ? user.name : null;

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [initData, setInitData] = useState(getInitData);
  const [responseLog, setResponseLog] = useState(null);

  // initData может появиться после инъекции Telegram (не сразу при загрузке)
  useEffect(() => {
    if (window.Telegram?.WebApp?.ready) {
      window.Telegram.WebApp.ready();
    }
    setInitData(getInitData());
    const t = setInterval(() => {
      const data = getInitData();
      if (data) {
        setInitData(data);
        clearInterval(t);
      }
    }, 150);
    const stop = setTimeout(() => clearInterval(t), 4000);
    return () => {
      clearInterval(t);
      clearTimeout(stop);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = question.trim();
    if (text.length < 5) {
      setError("Опиши вопрос чуть подробнее, хотя бы в несколько слов");
      return;
    }

    // На localhost скрипт Telegram создаёт WebApp, но initData пустой — не считаем это «в Telegram»
    const inTelegram =
      typeof window !== "undefined" && window.Telegram?.WebApp && !isLocalDev();
    let currentInitData = getInitData();

    // Только внутри Telegram требуем initData (он может подставиться с задержкой — даём пару попыток)
    if (inTelegram && !currentInitData) {
      await new Promise((r) => setTimeout(r, 800));
      currentInitData = getInitData();
    }
    if (inTelegram && !currentInitData) {
      await new Promise((r) => setTimeout(r, 800));
      currentInitData = getInitData();
    }
    if (inTelegram && !currentInitData) {
      setError(
        "Данные от Telegram ещё не подгрузились. Подожди 2–3 секунды и нажми «Отправить» снова."
      );
      return;
    }

    // Локально в браузере (не Telegram) initData пустой — бэкенд в dev (npm run dev:api) примет запрос по DEV_USER_ID
    if (!inTelegram && !currentInitData) {
      currentInitData = "";
    }

    setError(null);
    setLoading(true);
    setAnswer(null);
    setResponseLog(null);

    try {
      const res = await fetch(`${getApiUrl()}/api/free-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initData: currentInitData || "",
          question: text,
        }),
      });
      const data = await res.json().catch(() => ({}));

      setResponseLog({
        status: res.status,
        ok: res.ok,
        url: `${getApiUrl()}/api/free-question`,
        body: data,
        bodyRaw: JSON.stringify(data, null, 2),
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError(
            "Сессия не распознана. Закрой и снова открой приложение из бота (🔮 Открыть приложение), затем отправь вопрос."
          );
        } else {
          const msg = data.error || "Что-то пошло не так";
          setError(
            data.serverError ? `${msg} (сервер: ${data.serverError})` : msg
          );
        }
        return;
      }
      setAnswer(data.answer);
      setQuestion("");
    } catch (err) {
      setResponseLog({
        error: err?.message || String(err),
        stack: err?.stack,
      });
      const isNetwork =
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("Load failed") ||
        err?.message?.includes("NetworkError");
      setError(
        isNetwork
          ? "Не удалось подключиться к API. В отдельном терминале запусти: npm run dev:api"
          : "Не удалось отправить вопрос. Проверь интернет и попробуй снова."
      );
    } finally {
      setLoading(false);
    }
  };

  if (answer) {
    return (
      <div className="screen">
        <header
          className="header header-compact"
          data-aos="fade-down"
        >
          <button
            className="btn-back"
            onClick={() => setAnswer(null)}
          >
            ←
          </button>
          <h1>Ответ</h1>
        </header>
        <main>
          <div
            className="card"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p className="free-tarot-answer">{answer}</p>
            <p
              className="subtitle"
              style={{ marginTop: "16px", fontSize: "13px" }}
            >
              Бесплатный вопрос использован. Следующий будет через 3 дня.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setAnswer(null)}
          >
            Задать ещё вопрос
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBack}
            style={{ marginTop: "8px" }}
          >
            ← В меню
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="screen">
      <header
        className="header header-compact"
        data-aos="fade-down"
      >
        <button
          className="btn-back"
          onClick={onBack}
        >
          ←
        </button>
        <h1>Бесплатный вопрос</h1>
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <div
            className="card"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            <p
              className="subtitle"
              style={{ marginBottom: "16px" }}
            >
              {userName
                ? `${userName}, один бесплатный вопрос картам. Напиши, что хочешь узнать ✨`
                : "Один бесплатный вопрос картам. Напиши, что хочешь узнать ✨"}
            </p>
            <label className="review-label">
              <textarea
                className="review-textarea"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Например: что меня ждёт в отношениях? Или: как действовать с деньгами?"
                rows={4}
                disabled={loading}
              />
            </label>
            {error && (
              <p
                className="free-tarot-error"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className={`btn btn-primary ${loading ? "free-tarot-submit--loading" : ""}`}
            disabled={loading || question.trim().length < 5}
          >
            {loading ? (
              <TarotShuffleLoader size={48} aria-label="Загрузка" />
            ) : (
              "Отправить вопрос ✨"
            )}
          </button>
          {responseLog && (
            <pre className="free-tarot-response-log" aria-live="polite">
              {responseLog.bodyRaw
                ? `[${responseLog.status}] ${responseLog.ok ? "OK" : "ERR"}\n${responseLog.bodyRaw}`
                : `[error] ${responseLog.error || ""}${responseLog.stack ? `\n${responseLog.stack}` : ""}`}
            </pre>
          )}
        </form>
      </main>
    </div>
  );
}
