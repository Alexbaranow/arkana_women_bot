import { useState, useCallback } from "react";
import {
  ScreenId,
  StubTitles,
  DEFAULT_SCREEN,
  FALLBACK_SCREEN,
} from "../constants/screens";

/**
 * Хук навигации — только логика переключения экранов
 * @returns {{ currentScreen: string, goTo: function, goBack: function, stubTitle: string }}
 */
export function useNavigation() {
  const [currentScreen, setCurrentScreen] = useState(DEFAULT_SCREEN);
  const [stubTitle, setStubTitle] = useState("");

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
