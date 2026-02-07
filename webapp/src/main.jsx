import React from "react";
import ReactDOM from "react-dom/client";
import { NatalChartProvider } from "./context/NatalChartContext";
import { CardDayRequestProvider } from "./context/CardDayRequestContext";
import App from "./App";
import "aos/dist/aos.css";
import "./style.css";

// Фиксируем границы окна Telegram Mini App с самого старта — иначе при переходах/отправке экран «приближается»
if (typeof window !== "undefined" && window.Telegram?.WebApp) {
  window.Telegram.WebApp.ready();
  window.Telegram.WebApp.expand();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NatalChartProvider>
      <CardDayRequestProvider>
        <App />
      </CardDayRequestProvider>
    </NatalChartProvider>
  </React.StrictMode>
);
