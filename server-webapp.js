/**
 * Сервер для деплоя: раздаёт веб-приложение (UI) + API /api/free-question.
 * Запускается в Docker на хосте.
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

import express from "express";
import app from "./api.js";

const PORT = Number(process.env.PORT) || 8080;
const staticDir = join(__dirname, "webapp", "dist");

// Проверка живости для nginx / мониторинга
app.get("/health", (req, res) => {
  res.status(200).send("ok");
});

// Статика веб-приложения (собранный билд)
app.use(express.static(staticDir));

// SPA: все остальные GET-запросы отдаём index.html (клиентский роутинг)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(join(staticDir, "index.html"));
});

if (!existsSync(staticDir)) {
  console.error(`[server-webapp] Папка не найдена: ${staticDir}`);
  process.exit(1);
}

app.listen(PORT, () => {
  console.log(`🌐 UI + API: http://0.0.0.0:${PORT}`);
});
