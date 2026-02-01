export default function Landing({ onStart }) {
  return (
    <div className="screen">
      <header className="header">
        <div className="logo">🔮</div>
        <h1>Женский Аркан</h1>
        <p className="subtitle">Таро и нумерология — в твоём телефоне</p>
      </header>

      <main>
        <div className="card">
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
        >
          ✨ Начать
        </button>

        <div className="divider"></div>

        <p
          className="subtitle"
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "var(--color-text-muted)",
          }}
        >
          Расклады от реального таролога · Без ИИ
        </p>
      </main>
    </div>
  );
}
