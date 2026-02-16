/**
 * РЕЖИМ РАЗРАБОТКИ — только API, без бота.
 *
 * Назначение: проверка UI веб-приложения из браузера (http://localhost:3000).
 * Запуск:     npm run dev:api  (в отдельном терминале от npm run webapp).
 *
 * Что делает:
 * - Подгружает .env из корня проекта
 * - Поднимает API на порту 3001 (или API_PORT из .env)
 * - Бот не передаётся (createApiServer(port, null)) — оплата Stars в dev недоступна
 *
 * Vite (npm run webapp) проксирует запросы /api → http://localhost:3001.
 * В api.js при NODE_ENV !== "production" запросы без Telegram initData
 * обрабатываются под пользователем DEV_USER_ID (см. docs/DEV.md).
 */
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

import { createApiServer } from "./api.js";

const API_PORT = Number(process.env.API_PORT) || 3001;

console.log("📡 Запуск только API для разработки (без бота)...");
const server = createApiServer(API_PORT, null);
server.on("error", (err) => {
  if (err?.code === "EADDRINUSE") {
    console.error(
      `\n❌ Порт ${API_PORT} занят. Останови другой процесс:\n   lsof -i :${API_PORT}\n   kill $(lsof -i :${API_PORT} -t)\n`
    );
    process.exit(1);
  }
  throw err;
});
console.log(
  "   Открой веб-приложение: npm run webapp, затем http://localhost:3000"
);
