import { useState } from "react";
import { I_RECOMMEND_URL } from "../constants/screens";

const STARS = [1, 2, 3, 4, 5];

export default function LeaveReview({ onBack, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;

    onSubmit?.({ rating, text });
    setIsSubmitted(true);
  };

  const handleIRRecommend = () => {
    window.open(I_RECOMMEND_URL, "_blank");
  };

  if (isSubmitted) {
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
          <h1>Спасибо!</h1>
        </header>
        <main>
          <div
            className="card"
            data-aos="zoom-in"
            data-aos-delay="100"
          >
            <p
              className="subtitle"
              style={{ textAlign: "center", marginBottom: "24px" }}
            >
              Твой отзыв сохранён. Это очень ценно для меня! ✨
            </p>
            <p
              className="subtitle"
              style={{ fontSize: "13px", marginBottom: "16px" }}
            >
              Хочешь оставить отзыв ещё и на платформе? Это поможет другим найти
              меня.
            </p>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleIRRecommend}
            >
              🌟 Опубликовать на iRecommend.ru
            </button>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            onClick={onBack}
          >
            Вернуться в меню
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
        <h1>Оставить отзыв</h1>
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
              Твоё мнение важно! Оцени, пожалуйста:
            </p>
            <div className="rating-stars">
              {STARS.map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${rating >= star ? "active" : ""}`}
                  onClick={() => setRating(star)}
                >
                  ⭐
                </button>
              ))}
            </div>
            <label className="review-label">
              <span className="subtitle">Комментарий (по желанию)</span>
              <textarea
                className="review-textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Расскажи о своём опыте..."
                rows={4}
              />
            </label>
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={rating === 0}
          >
            Отправить отзыв ✨
          </button>
        </form>
      </main>
    </div>
  );
}
