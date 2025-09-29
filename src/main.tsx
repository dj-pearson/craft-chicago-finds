import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AnalyticsProvider } from './components/analytics';
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <BrowserRouter>
      <AnalyticsProvider>
        <App />
      </AnalyticsProvider>
    </BrowserRouter>
  </HelmetProvider>
);
