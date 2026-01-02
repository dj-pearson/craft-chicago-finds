import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsProvider } from './components/analytics';
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";

// Hide the initial loading skeleton once React is ready
function hideInitialLoader() {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.classList.add('loaded');
    // Remove from DOM after transition completes
    setTimeout(() => loader.remove(), 200);
  }
}

// Defer non-critical initialization to after page is interactive
function initDeferredFeatures() {
  // Use requestIdleCallback for non-critical init, with timeout fallback
  const scheduleInit = (callback: () => void, timeout = 2000) => {
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void, opts: { timeout: number }) => void })
        .requestIdleCallback(callback, { timeout });
    } else {
      setTimeout(callback, 100);
    }
  };

  // Initialize performance monitoring after main content is painted
  scheduleInit(async () => {
    const { initCoreWebVitals } = await import("./lib/performance");
    initCoreWebVitals();
  }, 3000);

  // Enable service worker in production (deferred for faster initial load)
  if (import.meta.env.PROD) {
    scheduleInit(async () => {
      const { registerServiceWorker } = await import("./lib/serviceWorker");
      registerServiceWorker();
    }, 5000);
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

// Initialize deferred features after first paint
if (typeof window !== 'undefined') {
  // Wait for first paint before scheduling deferred work
  if (document.readyState === 'complete') {
    initDeferredFeatures();
  } else {
    window.addEventListener('load', initDeferredFeatures, { once: true });
  }
}
