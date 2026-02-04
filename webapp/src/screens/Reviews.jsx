export default function Reviews({ onBack }) {
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
        <h1>Отзывы</h1>
      </header>
      <main>
        <div
          className="card"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <p className="subtitle">Пока нет отзывов. Стань первой!</p>
        </div>
      </main>
    </div>
  );
}
