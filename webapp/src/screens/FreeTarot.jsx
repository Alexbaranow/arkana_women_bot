export default function FreeTarot({ onBack }) {
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
        <div className="card">
          <p className="subtitle">Здесь будет форма вопроса. Скоро.</p>
        </div>
      </main>
    </div>
  );
}
