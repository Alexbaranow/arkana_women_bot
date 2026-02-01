import { createScreenRegistry } from "../config/screenConfig";

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
  const entry = registry[currentScreen];

  if (!entry) {
    return null;
  }

  const { component: Screen, getProps } = entry;
  const props = getProps();

  return <Screen {...props} />;
}
