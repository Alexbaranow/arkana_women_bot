import React from "react";
import ReactDOM from "react-dom/client";
import { NatalChartProvider } from "./context/NatalChartContext";
import App from "./App";
import "aos/dist/aos.css";
import "./style.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NatalChartProvider>
      <App />
    </NatalChartProvider>
  </React.StrictMode>
);
