/**
 * Расклад Таро (по сценарию TarotController + TarotCard):
 * веер карт с 3D, интерполяцией и периодической перетасовкой слотов.
 * Компактный режим (size <= 36): одна карта с плавной пульсацией, без тасовки.
 */
import { useEffect, useRef } from "react";
import { DEBUG_TAROT_CARD_IMAGES } from "../constants/tarotCards";

const CARD_COUNT = 5;
const LERP = 0.04;
const SHUFFLE_INTERVAL_MS = 3600;

function interpolation(value, min, max, newMin, newMax) {
  return ((value - min) / (max - min)) * (newMax - newMin) + newMin;
}

function calculateProps(index, amount, size) {
  const coeff = interpolation(index, 0, amount - 1, -1, 1);
  const spreadX = size * 1.7;
  const depthZ = size * 0.15;
  return {
    pos: {
      x: coeff * spreadX,
      y: 0,
      z: -(Math.cos(coeff * Math.PI * 0.5) - 1) * depthZ,
    },
    rotate: {
      x: 0,
      y: -(coeff * 30),
    },
  };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function TarotShuffleLoader({
  size = 72,
  className = "",
  "aria-label": ariaLabel,
  compact,
}) {
  const isCompact = compact ?? size <= 36;
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const stateRef = useRef({
    cards: [],
    order: Array.from({ length: CARD_COUNT }, (_, i) => i),
  });

  useEffect(() => {
    if (isCompact) return;
    const state = stateRef.current;
    const amount = CARD_COUNT;

    // Инициализация позиций/поворотов по слотам
    for (let i = 0; i < amount; i++) {
      if (!state.cards[i]) {
        state.cards[i] = {
          pos: { x: 0, y: 0, z: 0 },
          targetPos: { x: 0, y: 0, z: 0 },
          rotate: { x: 0, y: 0 },
          targetRotate: { x: 0, y: 0 },
        };
      }
      const target = calculateProps(i, amount, size);
      state.cards[i].targetPos = { ...target.pos };
      state.cards[i].pos = { ...target.pos };
      state.cards[i].targetRotate = { ...target.rotate };
      state.cards[i].rotate = { ...target.rotate };
    }

    let rafId;
    const loop = () => {
      const { cards, order } = stateRef.current;
      for (let i = 0; i < amount; i++) {
        const slotIndex = order.indexOf(i);
        const target = calculateProps(slotIndex, amount, size);
        const c = cards[i];
        if (!c) continue;
        ["x", "y", "z"].forEach((k) => {
          c.targetPos[k] = target.pos[k];
          c.pos[k] += (c.targetPos[k] - c.pos[k]) * LERP;
        });
        ["x", "y"].forEach((k) => {
          c.targetRotate[k] = target.rotate[k];
          c.rotate[k] += (c.targetRotate[k] - c.rotate[k]) * LERP;
        });
        const el = cardRefs.current[i];
        if (el) {
          el.style.transform = `translate3d(${c.pos.x}px, ${c.pos.y}px, ${c.pos.z}px) rotateX(${c.rotate.x}deg) rotateY(${c.rotate.y}deg)`;
        }
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const shuffleInterval = setInterval(() => {
      stateRef.current.order = shuffleArray(stateRef.current.order);
    }, SHUFFLE_INTERVAL_MS);

    return () => {
      cancelAnimationFrame(rafId);
      clearInterval(shuffleInterval);
    };
  }, [size, isCompact]);

  const cardWidth = Math.max(10, size * 0.54);
  const cardHeight = cardWidth * (16 / 9);
  const cardImages = DEBUG_TAROT_CARD_IMAGES;

  if (isCompact) {
    const cardImg = cardImages[0];
    return (
      <span
        className={`tarot-shuffle-loader tarot-shuffle-loader--compact ${className}`.trim()}
        role="status"
        aria-label={ariaLabel || "Загрузка"}
        style={{
          width: size,
          height: size,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          className="tarot-shuffle-loader__card tarot-shuffle-loader__card--compact"
          style={{
            width: cardWidth,
            height: cardHeight,
            backgroundImage: cardImg ? `url(${cardImg})` : undefined,
          }}
        />
      </span>
    );
  }

  return (
    <span
      className={`tarot-shuffle-loader ${className}`.trim()}
      role="status"
      aria-label={ariaLabel || "Загрузка"}
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        ref={containerRef}
        className="tarot-shuffle-loader__scene"
        style={{
          position: "relative",
          width: size,
          height: size,
          perspective: Math.max(400, size * 8),
          perspectiveOrigin: "50% 50%",
        }}
      >
        {Array.from({ length: CARD_COUNT }, (_, i) => (
          <div
            key={i}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className="tarot-shuffle-loader__card"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: cardWidth,
              height: cardHeight,
              marginLeft: -cardWidth / 2,
              marginTop: -cardHeight / 2,
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            <div
              className="tarot-shuffle-loader__card-back"
              style={{
                backgroundImage: `url(${cardImages[i % cardImages.length]})`,
              }}
            />
          </div>
        ))}
      </div>
    </span>
  );
}
