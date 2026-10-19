import { useApp } from "../context/AppContext";

// Every screen keeps its text in a sibling *.copy.js file shaped
// { en: {...}, te: {...} } with identical keys (checked by copy.test.js).
// The whole app shows one language at a time — never both side by side.
export function useCopy(copy) {
  const { language } = useApp();
  return copy[language] || copy.te;
}
