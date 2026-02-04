import { useNavigation } from "./hooks/useNavigation";
import { useNatalChart } from "./context/NatalChartContext";
import ScreenRouter from "./components/ScreenRouter";

export default function App() {
  const { currentScreen, goTo, goBack, stubTitle, screenPayload } =
    useNavigation();
  const { isCalculating } = useNatalChart();

  return (
    <>
      {isCalculating && (
        <div
          className="global-natal-indicator"
          role="status"
          aria-live="polite"
        >
          <div className="global-natal-indicator-track">
            <div className="global-natal-indicator-fill" />
          </div>
          <span className="global-natal-indicator-text">
            Рассчитываем асцендент и натальную карту…
          </span>
        </div>
      )}
      <ScreenRouter
        currentScreen={currentScreen}
        goTo={goTo}
        goBack={goBack}
        stubTitle={stubTitle}
        screenPayload={screenPayload}
      />
    </>
  );
}
