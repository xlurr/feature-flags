import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// гарантируем что hash-router стартует с "/"
if (!window.location.hash || window.location.hash === "#") {
  window.location.hash = "/";
}

createRoot(document.getElementById("root")!).render(<App />);