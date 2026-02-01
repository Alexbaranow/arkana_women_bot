import { createScreenRegistry } from "../config/screenConfig";
import { FALLBACK_SCREEN } from "../constants/screens";

/**
 * Маршрутизатор экранов
 */
export default function ScreenRouter({
  currentScreen,
  goTo,
  goBack,
  stubTitle,
}) {
  const registry = createScreenRegistry({ goTo, goBack, stubTitle });
  const entry = registry[currentScreen] ?? registry[FALLBACK_SCREEN];

  if (!entry) {
    return null;
  }

  const { component: Screen, getProps } = entry;
  const props = getProps();

  return <Screen {...props} />;
}
