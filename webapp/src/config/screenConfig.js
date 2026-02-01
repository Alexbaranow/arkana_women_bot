/**
 * Реестр экранов
 */
import { ScreenId } from "../constants/screens";
import Landing from "../screens/Landing";
import MainMenu from "../screens/MainMenu";
import FreeTarot from "../screens/FreeTarot";
import Reviews from "../screens/Reviews";
import Stub from "../screens/Stub";
import LeaveReview from "../screens/LeaveReview";

/**
 * @typedef {Object} ScreenEntry
 * @property {React.ComponentType} component
 * @property {function(ScreenRenderer): object} getProps - получает пропсы на основе рендерера
 */

/**
 * @param {object} renderer - { goTo, goBack, stubTitle }
 */
export function createScreenRegistry(renderer) {
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
    [ScreenId.FREE_TAROT]: {
      component: FreeTarot,
      getProps: () => ({ onBack: goBack }),
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
