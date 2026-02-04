/**
 * Реестр экранов
 */
import { ScreenId } from "../constants/screens";
import Landing from "../screens/Landing";
import MainMenu from "../screens/MainMenu";
import Onboarding from "../screens/Onboarding";
import FreeTarot from "../screens/FreeTarot";
import AllSpreads from "../screens/AllSpreads";
import Reviews from "../screens/Reviews";
import Stub from "../screens/Stub";
import LeaveReview from "../screens/LeaveReview";

/**
 * @typedef {Object} ScreenEntry
 * @property {React.ComponentType} component
 * @property {function(ScreenRenderer, object?): object} getProps - получает пропсы на основе рендерера и payload
 */

/**
 * @param {object} renderer - { goTo, goBack, stubTitle }
 * @param {object} [screenPayload] - опциональные данные для экрана (например next для onboarding)
 */
export function createScreenRegistry(renderer, screenPayload = null) {
  const { goTo, goBack, stubTitle } = renderer;

  return {
    [ScreenId.LANDING]: {
      component: Landing,
      getProps: () => ({ onStart: () => goTo(ScreenId.MAIN) }),
    },
    [ScreenId.MAIN]: {
      component: MainMenu,
      getProps: () => ({ onNavigate: goTo }),
    },
    [ScreenId.ONBOARDING]: {
      component: Onboarding,
      getProps: () => ({
        onBack: goBack,
        onComplete: () => {
          const next = screenPayload?.next;
          if (next) goTo(next);
          else goBack();
        },
      }),
    },
    [ScreenId.FREE_TAROT]: {
      component: FreeTarot,
      getProps: () => ({ onBack: goBack }),
    },
    [ScreenId.ALL_SPREADS]: {
      component: AllSpreads,
      getProps: () => ({ onBack: goBack, onNavigate: goTo }),
    },
    [ScreenId.REVIEWS]: {
      component: Reviews,
      getProps: () => ({ onBack: goBack }),
    },
    [ScreenId.LEAVE_REVIEW]: {
      component: LeaveReview,
      getProps: () => ({
        onBack: goBack,
        onSubmit: (data) => {
          // TODO: вызвать API для сохранения отзыва
          console.log("Review submitted:", data);
        },
      }),
    },
    [ScreenId.STUB]: {
      component: Stub,
      getProps: () => ({ title: stubTitle, onBack: goBack }),
    },
  };
}
