export default function Landing({ onStart }) {
  return (
    <div className="screen">
      <header
        className="header"
        data-aos="fade-down"
      >
        <div className="logo">🔮</div>
        <h1>Женский Аркан</h1>
        <p className="subtitle">Таро и нумерология — в твоём телефоне</p>
      </header>

      <main>
        <div
          className="card"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <p
            className="subtitle"
            style={{ marginBottom: 0 }}
          >
            Один бесплатный вопрос картам каждые 3 дня. Любовь, деньги,
            здоровье, предназначение — задай то, что волнует.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={onStart}
          data-aos="zoom-in"
          data-aos-delay="200"
        >
          ✨ Начать
        </button>

        <div
          className="divider"
          data-aos="fade"
          data-aos-delay="300"
        ></div>

        <p
          className="subtitle"
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "var(--color-text-muted)",
          }}
          data-aos="fade-up"
          data-aos-delay="350"
        >
          Расклады от реального таролога · Без ИИ
        </p>
      </main>
    </div>
  );
}
