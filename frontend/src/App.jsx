import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { GuestOnlyRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { PageSkeleton, Spinner } from "./components/common";
import { Toaster } from "./components/ui/toaster";
import AppLayout from "./components/layout/AppLayout";
import PublicLayout from "./components/layout/PublicLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";

// Heavier pages (charts, Monaco, Vapi) load on demand.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Setup = lazy(() => import("./pages/Setup"));
const Quiz = lazy(() => import("./pages/Quiz"));
const SessionReport = lazy(() => import("./pages/SessionReport"));
const History = lazy(() => import("./pages/History"));
const VoiceInterview = lazy(() => import("./pages/VoiceInterview"));
const Resume = lazy(() => import("./pages/Resume"));
const CodingList = lazy(() => import("./pages/CodingList"));
const CodingProblem = lazy(() => import("./pages/CodingProblem"));
const Leaderboard = lazy(() => import("./pages/Leaderboard"));
const Settings = lazy(() => import("./pages/Settings"));

const lazyPage = (el) => <Suspense fallback={<PageSkeleton />}>{el}</Suspense>;
const lazyFocus = (el) => <Suspense fallback={<Spinner />}>{el}</Suspense>;

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={lazyPage(<Dashboard />)} />
            <Route path="/setup" element={lazyPage(<Setup />)} />
            <Route path="/voice" element={lazyPage(<VoiceInterview />)} />
            <Route path="/coding" element={lazyPage(<CodingList />)} />
            <Route path="/resume" element={lazyPage(<Resume />)} />
            <Route path="/history" element={lazyPage(<History />)} />
            <Route path="/leaderboard" element={lazyPage(<Leaderboard />)} />
            <Route path="/sessions/:id" element={lazyPage(<SessionReport />)} />
            <Route path="/settings" element={lazyPage(<Settings />)} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
          </Route>
          {/* Focus screens: full width, no sidebar */}
          <Route path="/interview/:id" element={lazyFocus(<Quiz />)} />
          <Route path="/coding/:slug" element={lazyFocus(<CodingProblem />)} />
        </Route>

        <Route element={<PublicLayout />}>
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <Toaster />
    </>
  );
}
