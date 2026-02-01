export default function Landing({ onStart }) {
  return (
    <div className="screen">
      <header className="header">
        <div className="logo">🔮</div>
        <h1>Аркана</h1>
        <p className="subtitle">Расклады от реального таролога</p>
      </header>

      <main>
        <div className="card">
          <p className="subtitle">
            Реальный таролог (не ИИ!) заглянет в твоё будущее через карты и дату
            рождения.
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
          style={{ textAlign: "center", fontSize: "13px" }}
        >
          Помогу с любовью ❤️, деньгами 💰, здоровьем 💚, предназначением 🌙
        </p>
      </main>
    </div>
  );
}
