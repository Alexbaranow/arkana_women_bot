/**
 * Реестр экранов
 */
import { ScreenId } from "../constants/screens";
import Landing from "../screens/Landing";
import MainMenu from "../screens/MainMenu";
import Profile from "../screens/Profile";
import Onboarding from "../screens/Onboarding";
import FreeTarot from "../screens/FreeTarot";
import AllSpreads from "../screens/AllSpreads";
import Numerology from "../screens/Numerology";
import Checkout from "../screens/Checkout";
import CardDayRequest from "../screens/CardDayRequest";
import Reviews from "../screens/Reviews";
import Stub from "../screens/Stub";
import LeaveReview from "../screens/LeaveReview";

/**
 * @typedef {Object} ScreenEntry
 * @property {React.ComponentType} component
 * @property {function(ScreenRenderer, object?): object} getProps - получает пропсы на основе рендерера и payload
 */

/** Куда перейти после онбординга: экран или checkout с productId */
function completeOnboarding(goTo, goBack, next) {
  if (!next) {
    goBack();
    return;
  }
  if (Object.values(ScreenId).includes(next)) {
    goTo(next);
  } else if (next === "card-day") {
    goTo(ScreenId.CARD_DAY_REQUEST);
  } else {
    goTo(ScreenId.CHECKOUT, { productId: next });
  }
}

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
    [ScreenId.PROFILE]: {
      component: Profile,
      getProps: () => ({ onBack: goBack, onNavigate: goTo }),
    },
    [ScreenId.ONBOARDING]: {
      component: Onboarding,
      getProps: () => ({
        onBack: goBack,
        onComplete: () => completeOnboarding(goTo, goBack, screenPayload?.next),
        next: screenPayload?.next ?? null,
      }),
    },
    [ScreenId.FREE_TAROT]: {
      component: FreeTarot,
      getProps: () => ({ onBack: goBack }),
    },
    [ScreenId.NUMEROLOGY]: {
      component: Numerology,
      getProps: () => ({ onBack: goBack, onNavigate: goTo }),
    },
    [ScreenId.ALL_SPREADS]: {
      component: AllSpreads,
      getProps: () => ({ onBack: goBack, onNavigate: goTo }),
    },
    [ScreenId.CHECKOUT]: {
      component: Checkout,
      getProps: () => ({
        onBack: goBack,
        productId: screenPayload?.productId ?? null,
      }),
    },
    [ScreenId.CARD_DAY_REQUEST]: {
      component: CardDayRequest,
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
        onSubmit: () => {}, // TODO: API сохранения отзыва
      }),
    },
    [ScreenId.STUB]: {
      component: Stub,
      getProps: () => ({ title: stubTitle, onBack: goBack }),
    },
  };
}
