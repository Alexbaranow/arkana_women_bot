import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

function getInitData() {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData ?? "";
}

export default function FreeTarot({ onBack }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);
  const [initData, setInitData] = useState(getInitData);

  // initData может появиться после инъекции Telegram (не сразу при загрузке)
  useEffect(() => {
    setInitData(getInitData());
    const t = setInterval(() => {
      const data = getInitData();
      if (data) {
        setInitData(data);
        clearInterval(t);
      }
    }, 200);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const text = question.trim();
    if (text.length < 5) {
      setError("Опиши вопрос чуть подробнее, хотя бы в несколько слов");
      return;
    }
    if (!initData) {
      setError("Открой приложение из Telegram, чтобы задать вопрос");
      return;
    }

    setError(null);
    setLoading(true);
    setAnswer(null);

    try {
      const res = await fetch(`${API_URL}/api/free-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData, question: text }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Что-то пошло не так");
        return;
      }
      setAnswer(data.answer);
      setQuestion("");
    } catch (err) {
      setError(
        "Не удалось отправить вопрос. Проверь интернет и попробуй снова."
      );
    } finally {
      setLoading(false);
    }
  };

  if (answer) {
    return (
      <div className="screen">
        <header className="header header-compact">
          <button
            className="btn-back"
            onClick={() => setAnswer(null)}
          >
            ←
          </button>
          <h1>Ответ</h1>
        </header>
        <main>
          <div className="card">
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
      <header className="header header-compact">
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
          <div className="card">
            <p
              className="subtitle"
              style={{ marginBottom: "16px" }}
            >
              Один бесплатный вопрос к нейросети. Напиши, что хочешь узнать ✨
            </p>
            <label className="review-label">
              <textarea
                className="review-textarea"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Например: что меня ждёт на этой неделе?"
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
            className="btn btn-primary"
            disabled={loading || question.trim().length < 5}
          >
            {loading ? "🔮 Думаю над вопросом..." : "Отправить вопрос ✨"}
          </button>
        </form>
      </main>
    </div>
  );
}
