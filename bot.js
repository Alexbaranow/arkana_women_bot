import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, ".env") });

import { bot, setupCommands } from "./botInstance.js";
import { createApiServer } from "./api.js";

const API_PORT = Number(process.env.API_PORT) || 3001;

console.log("🔮 Arkana Bot запускается...");
console.log(
  "[bot] WEBAPP_URL при старте:",
  process.env.WEBAPP_URL ? process.env.WEBAPP_URL : "(не задан)"
);

createApiServer(API_PORT, bot);

(async () => {
  try {
    await setupCommands();
  } catch (e) {
    console.warn("[bot] setMyCommands failed:", e?.message);
  }
  await bot.start();
})();
