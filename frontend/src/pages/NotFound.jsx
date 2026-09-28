import { Link } from "react-router-dom";
import { GradientButton } from "@/components/common";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <p className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-8xl font-extrabold text-transparent">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page skipped the interview</h1>
      <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist.</p>
      <GradientButton as={Link} to="/" className="mt-6">
        Back home
      </GradientButton>
    </div>
  );
}
