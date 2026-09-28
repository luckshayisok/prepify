import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import "@fontsource-variable/inter";
import App from "./App.jsx";
import "./index.css";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { TooltipProvider } from "./components/ui/tooltip.jsx";
import { GOOGLE_CLIENT_ID } from "./lib/config.js";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors like 404 / 401.
      retry: (count, err) => count < 2 && !(err?.response?.status >= 400 && err.response.status < 500),
    },
  },
});

const app = (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider delayDuration={200}>
        <App />
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        {/* Google's script only loads when sign-in with Google is configured. */}
        {GOOGLE_CLIENT_ID ? <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider> : app}
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
