export default function Stub({ title, onBack }) {
  return (
    <div className="screen">
      <header className="header header-compact">
        <button
          className="btn-back"
          onClick={onBack}
        >
          ←
        </button>
        <h1>{title}</h1>
      </header>
      <main>
        <div className="card">
          <p className="subtitle">
            Этот раздел в разработке. Возвращайся позже! ✨
          </p>
        </div>
      </main>
    </div>
  );
}
