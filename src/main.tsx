import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsProvider } from './components/analytics';
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";
import { initCoreWebVitals } from "./lib/performance";
import { registerServiceWorker } from "./lib/serviceWorker";

// Hide the initial loading skeleton once React is ready
function hideInitialLoader() {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('loaded');
    // Remove from DOM after transition completes
    setTimeout(() => loader.remove(), 100);
  }
}

// Initialize performance monitoring
if (typeof window !== 'undefined') {
  initCoreWebVitals();

  // Enable service worker in production for offline caching and faster loads
  if (import.meta.env.PROD) {
    registerServiceWorker();
  }
}

const root = createRoot(document.getElementById("root")!);

root.render(
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <BrowserRouter>
        <AnalyticsProvider>
          <App />
        </AnalyticsProvider>
      </BrowserRouter>
    </HelmetProvider>
  </QueryClientProvider>
);

// Hide loader after React has rendered
hideInitialLoader();
