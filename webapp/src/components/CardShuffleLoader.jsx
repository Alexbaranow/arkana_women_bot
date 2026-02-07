/**
 * Индикатор загрузки в виде перетасовки карт (SVG с анимацией).
 */
const CARD_PROPS = [
  { x: 8, y: 14, opacity: 0.85, delayClass: "" },
  { x: 27, y: 10, opacity: 0.95, delayClass: "cards-shuffle-card-2" },
  { x: 46, y: 14, opacity: 0.85, delayClass: "cards-shuffle-card-3" },
];

export default function CardShuffleLoader({ size = 56, className = "", "aria-label": ariaLabel }) {
  return (
    <span
      className={`cards-shuffle-loader ${className}`.trim()}
      role="status"
      aria-label={ariaLabel || "Загрузка"}
      style={{ width: size, height: size, display: "inline-block" }}
    >
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <g className="cards-shuffle-loader-cards">
          {CARD_PROPS.map(({ x, y, opacity, delayClass }, i) => (
            <rect
              key={i}
              className={`cards-shuffle-card ${delayClass}`.trim()}
              x={x}
              y={y}
              width={26}
              height={36}
              rx={3}
              fill="currentColor"
              opacity={opacity}
            />
          ))}
        </g>
      </svg>
    </span>
  );
}
