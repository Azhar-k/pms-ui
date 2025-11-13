import { redirect } from "react-router";
import { tokenStorage } from "../services/auth";

/**
 * Require authentication for a route
 * Redirects to login if not authenticated
 */
export function requireAuth(request?: Request) {
  const isAuth = tokenStorage.isAuthenticated(request);
  console.log('[REQUIRE_AUTH] Checking authentication:', { isAuth, hasRequest: !!request });
  if (!isAuth) {
    const redirectTo = request 
      ? new URL(request.url).pathname 
      : typeof window !== 'undefined' 
        ? window.location.pathname 
        : '/';
    console.log('[REQUIRE_AUTH] Not authenticated, redirecting to login');
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

