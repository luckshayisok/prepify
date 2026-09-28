import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import { GuestOnlyRoute, ProtectedRoute } from "./components/ProtectedRoute";
import { Spinner } from "./components/common";
import { Toaster } from "./components/ui/toaster";
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
const Profile = lazy(() => import("./pages/Profile"));

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Suspense fallback={<Spinner />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/interview/:id" element={<Quiz />} />
            <Route path="/sessions/:id" element={<SessionReport />} />
            <Route path="/history" element={<History />} />
            <Route path="/voice" element={<VoiceInterview />} />
            <Route path="/resume" element={<Resume />} />
            <Route path="/coding" element={<CodingList />} />
            <Route path="/coding/:slug" element={<CodingProblem />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <Toaster />
    </div>
  );
}
