import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";
import { HttpError, unauthorized } from "../utils/httpError.js";

let client;

async function verifyWithGoogle(credential) {
  if (!env.googleClientId) throw new HttpError(503, "Google sign-in is not configured on the server (GOOGLE_CLIENT_ID missing)");
  client ??= new OAuth2Client(env.googleClientId);
  try {
    const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
    return ticket.getPayload();
  } catch {
    throw unauthorized("Google sign-in failed. Please try again.");
  }
}

let verifier = verifyWithGoogle;

// Verifies a Google Identity Services ID token and returns the verified profile.
export async function verifyGoogleCredential(credential) {
  const payload = await verifier(credential);
  if (!payload?.sub || !payload.email || !payload.email_verified) {
    throw unauthorized("Your Google account's email isn't verified.");
  }
  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    avatarUrl: payload.picture || "",
  };
}

// Tests swap in a fake verifier so they don't call Google.
export function setGoogleVerifier(fn) {
  verifier = fn ?? verifyWithGoogle;
}
