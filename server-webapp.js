/**
 * Сервер для деплоя: раздаёт веб-приложение (UI) + API (включая оплату Stars).
 * Бот и API работают одним процессом — оплата Stars доступна.
 * Запускается в Docker на хосте.
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

console.log("[startup] BOT_TOKEN:", process.env.BOT_TOKEN ? "***задан***" : "НЕТ");
console.log("[startup] WEBAPP_URL:", process.env.WEBAPP_URL || "(не задан)");

import express from "express";
import app from "./api.js";
import { bot, setupCommands } from "./botInstance.js";

const PORT = Number(process.env.PORT) || 8080;
const staticDir = join(__dirname, "webapp", "dist");

// Передаём бота в API — иначе оплата Stars недоступна
app.set("bot", bot);
const botAttached = !!app.get("bot");
console.log("[startup] Бот привязан к API (Stars):", botAttached ? "да" : "нет");

// Проверка живости для nginx / мониторинга (X-Stars-Available: 1 если бот привязан)
app.get("/health", (req, res) => {
  res.setHeader("X-Stars-Available", app.get("bot") ? "1" : "0");
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

// Запускаем бота (оплата Stars, команды и т.д.)
(async () => {
  try {
    await setupCommands();
  } catch (e) {
    console.warn("[bot] setMyCommands failed:", e?.message);
  }
  try {
    await bot.start();
    console.log("🔮 Бот запущен (оплата Stars доступна)");
  } catch (e) {
    console.error("[bot] Не удалось запустить бота:", e?.message || e);
    process.exitCode = 1;
  }
})();
