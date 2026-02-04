export function getInitData() {
  if (typeof window === "undefined") return "";
  return window.Telegram?.WebApp?.initData ?? "";
}
