export function getInitData() {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData ?? "";
}

/** Локальная разработка: браузер на localhost. Скрипт Telegram создаёт WebApp, но initData пустой — не требуем его. */
export function isLocalDev() {
  if (typeof window === "undefined") return false;
  const { hostname } = window.location || {};
  return hostname === "localhost" || hostname === "127.0.0.1";
}
