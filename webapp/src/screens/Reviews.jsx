export default function Reviews({ onBack }) {
  return (
    <div className="screen">
      <header className="header header-compact">
        <button
          className="btn-back"
          onClick={onBack}
        >
          ←
        </button>
        <h1>Отзывы</h1>
      </header>
      <main>
        <div className="card">
          <p className="subtitle">Пока нет отзывов. Стань первой!</p>
        </div>
      </main>
    </div>
  );
}
