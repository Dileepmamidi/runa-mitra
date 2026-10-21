import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { BrandSplash } from "../components/LoadingScreen";

// "/" route. The opening animation already played at launch (App.jsx), so
// this only decides where to go: home if signed in, otherwise login, or the
// language choice the very first time.
export function Splash() {
  const navigate = useNavigate();
  const { user } = useApp();

  useEffect(() => {
    let chosen = null;
    try {
      chosen = localStorage.getItem("runa-language");
    } catch {
      /* storage unavailable */
    }
    navigate(user ? "/home" : chosen ? "/login" : "/language", { replace: true });
  }, [navigate, user]);

  return <BrandSplash />;
}
