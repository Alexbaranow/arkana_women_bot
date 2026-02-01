import { useNavigation } from "./hooks/useNavigation";
import ScreenRouter from "./components/ScreenRouter";

export default function App() {
  const { currentScreen, goTo, goBack, stubTitle } = useNavigation();

  return (
    <ScreenRouter
      currentScreen={currentScreen}
      goTo={goTo}
      goBack={goBack}
      stubTitle={stubTitle}
    />
  );
}
