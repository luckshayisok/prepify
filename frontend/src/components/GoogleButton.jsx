import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { errorMessage } from "@/lib/api";
import { GOOGLE_CLIENT_ID } from "@/lib/config";

// Google's official button (renders in an iframe). Hidden when no client ID is configured.
export default function GoogleButton({ text = "continue_with", onError }) {
  const { loginWithGoogle } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const box = useRef(null);
  const [width, setWidth] = useState(360);

  // The button needs a pixel width (max 400); match the form width.
  useEffect(() => {
    if (!box.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.min(400, Math.round(e.contentRect.width))));
    ro.observe(box.current);
    return () => ro.disconnect();
  }, []);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div ref={box} className="flex h-10 w-full justify-center">
      <GoogleLogin
        key={`${theme}-${width}`}
        text={text}
        theme={theme === "dark" ? "filled_black" : "outline"}
        shape="rectangular"
        size="large"
        width={width}
        logo_alignment="center"
        onSuccess={async ({ credential }) => {
          try {
            await loginWithGoogle(credential);
            navigate(location.state?.from || "/dashboard", { replace: true });
          } catch (err) {
            onError?.(errorMessage(err, "Google sign-in failed"));
          }
        }}
        onError={() => onError?.("Google sign-in was cancelled or failed.")}
      />
    </div>
  );
}

export function OrDivider() {
  if (!GOOGLE_CLIENT_ID) return null;
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
    </div>
  );
}
