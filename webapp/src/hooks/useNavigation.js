import { useState, useCallback } from "react";
import {
  ScreenId,
  StubTitles,
  DEFAULT_SCREEN,
  FALLBACK_SCREEN,
} from "../constants/screens";



// ДОДЕЛАТЬ
function getHash() {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "");
}

/** Начальный экран из hash (бот открывает приложение с #freeTarot, #all-spreads и т.д.) */
function getInitialScreen() {
  const hash = getHash();
  if (hash && Object.values(ScreenId).includes(hash)) return hash;
  if (hash && StubTitles[hash]) return ScreenId.STUB;
  return DEFAULT_SCREEN;
}

function getInitialStubTitle() {
  const hash = getHash();
  return (hash && StubTitles[hash]) || "";
}

/**
 * Хук навигации — только логика переключения экранов
 * @returns {{ currentScreen: string, goTo: function, goBack: function, stubTitle: string }}
 */
export function useNavigation() {
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen);
  const [stubTitle, setStubTitle] = useState(getInitialStubTitle);

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
