import { redirect } from "react-router";
import { tokenStorage } from "../services/auth";

/**
 * Require authentication for a route
 * Redirects to login if not authenticated
 */
export function requireAuth(request?: Request) {
  if (!tokenStorage.isAuthenticated()) {
    const redirectTo = request 
      ? new URL(request.url).pathname 
      : typeof window !== 'undefined' 
        ? window.location.pathname 
        : '/';
    throw redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
}

/**
 * Redirect to home if already authenticated
 * Used for login page to prevent logged-in users from accessing it
 */
export function requireGuest() {
  if (tokenStorage.isAuthenticated()) {
    throw redirect("/");
  }
}

