import { createContext, useContext, useState, useCallback } from "react";

const CardDayRequestContext = createContext(null);

const noop = () => {};
const defaultState = {
  isRequesting: false,
  setRequesting: noop,
  justCardDayDone: false,
  setJustCardDayDone: noop,
  clearJustCardDayDone: noop,
};

export function CardDayRequestProvider({ children }) {
  const [isRequesting, setRequesting] = useState(false);
  const [justCardDayDone, setJustCardDayDone] = useState(false);
  const clearJustCardDayDone = useCallback(() => setJustCardDayDone(false), []);
  return (
    <CardDayRequestContext.Provider
      value={{
        isRequesting,
        setRequesting,
        justCardDayDone,
        setJustCardDayDone,
        clearJustCardDayDone,
      }}
    >
      {children}
    </CardDayRequestContext.Provider>
  );
}

export function useCardDayRequest() {
  return useContext(CardDayRequestContext) ?? defaultState;
}
