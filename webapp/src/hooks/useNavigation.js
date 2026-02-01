import { useState, useCallback, useEffect } from "react";
import {
  ScreenId,
  StubTitles,
  DEFAULT_SCREEN,
  FALLBACK_SCREEN,
} from "../constants/screens";

/** Экран из URL: ?screen= или ?screen%3D (Telegram иногда кодирует =). */
function getScreenFromUrl() {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  let q = url.searchParams.get("screen");
  if (q) return q;
  // Fallback: ?screen%3DfreeTarot — Telegram/клиент может закодировать =
  const search = url.search.replace(/^\?/, "");
  if (search) {
    for (const part of search.split("&")) {
      const decoded = decodeURIComponent(part.replace(/\+/g, " "));
      const eq = decoded.indexOf("=");
      if (eq > 0 && decoded.slice(0, eq) === "screen") {
        const val = decoded.slice(eq + 1).trim();
        if (val) return val;
      }
    }
  }
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const startParam =
    hashParams.get("tgWebAppStartParam") ||
    window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  return startParam || "";
}

function resolveScreenFromUrl() {
  const screen = getScreenFromUrl();
  if (screen && Object.values(ScreenId).includes(screen))
    return { screen, stubTitle: "" };
  if (screen && StubTitles[screen])
    return { screen: ScreenId.STUB, stubTitle: StubTitles[screen] };
  return { screen: DEFAULT_SCREEN, stubTitle: "" };
}

/**
 * Хук навигации — только логика переключения экранов
 * @returns {{ currentScreen: string, goTo: function, goBack: function, stubTitle: string }}
 */
export function useNavigation() {
  const [currentScreen, setCurrentScreen] = useState(
    () => resolveScreenFromUrl().screen
  );
  const [stubTitle, setStubTitle] = useState(
    () => resolveScreenFromUrl().stubTitle
  );

  // Перепроверяем URL при монтировании (Telegram/браузер могут подставить params позже)
  useEffect(() => {
    const { screen, stubTitle: st } = resolveScreenFromUrl();
    if (screen && screen !== DEFAULT_SCREEN) {
      setCurrentScreen(screen);
      if (st && screen === ScreenId.STUB) setStubTitle(st);
    }
  }, []);

  const goTo = useCallback((target) => {
    if (Object.values(ScreenId).includes(target)) {
      setCurrentScreen(target);
    } else if (StubTitles[target]) {
      setStubTitle(StubTitles[target]);
      setCurrentScreen(ScreenId.STUB);
    }
  }, []);

  const goBack = useCallback(() => {
    setCurrentScreen(FALLBACK_SCREEN);
  }, []);

  return {
    currentScreen,
    goTo,
    goBack,
    stubTitle,
  };
}
