import { createRoot } from "react-dom/client";
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from "@tanstack/react-query";
import { AnalyticsProvider } from './components/analytics';
import App from "./App.tsx";
import "./index.css";
import { queryClient } from "./lib/queryClient";

createRoot(document.getElementById("root")!).render(
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
