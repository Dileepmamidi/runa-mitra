import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";

const ROOT_PATHS = ["/", "/home", "/login", "/language", "/invitations"];

// Native-app behaviour (Android/iOS via Capacitor). Does nothing on the web.
// - Hardware back button goes back through screens and exits from a root screen.
export function NativeBridge() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathRef = useRef(location.pathname);
  pathRef.current = location.pathname;

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return undefined;
    const handle = NativeApp.addListener("backButton", () => {
      if (ROOT_PATHS.includes(pathRef.current)) NativeApp.exitApp();
      else navigate(-1);
    });
    return () => {
      handle.then((h) => h.remove());
    };
  }, [navigate]);

  return null;
}
