import { redirect } from "react-router";
import { tokenStorage, authAPI, type UserResponse } from "../services/auth";

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
 * Check if user has admin role
 * Case-insensitive check for 'admin' role
 */
export function isAdmin(user: UserResponse | null): boolean {
  if (!user?.roles || user.roles.length === 0) {
    return false;
  }
  return user.roles.some(role => role.toUpperCase() === 'ADMIN');
}

/**
 * Require admin role for a route
 * Fetches current user from API and checks for admin role
 * Redirects to home if not admin
 */
export async function requireAdmin(request?: Request) {
  requireAuth(request);
  
  try {
    // Fetch current user from API to get fresh role data
    const user = await authAPI.getCurrentUser(request);
    if (!isAdmin(user)) {
      throw redirect('/');
    }
  } catch (error) {
    // If fetching user fails or user is not admin, redirect to home
    if (error instanceof Response && error.status === 302) {
      // Re-throw redirect
      throw error;
    }
    throw redirect('/');
  }
}

/**
 * Redirect to front desk if already authenticated
 * Used for login page to prevent logged-in users from accessing it
 */
export function requireGuest() {
  if (tokenStorage.isAuthenticated()) {
    throw redirect("/front-desk");
  }
}

/**
 * Handle API errors in route loaders/actions
 * If the error is UNAUTHORIZED, redirects to login
 * Otherwise, re-throws the error
 */
export function handleAPIError(error: unknown, request?: Request): never {
  if (error instanceof Error && error.message === 'UNAUTHORIZED') {
    const redirectTo = request 
      ? new URL(request.url).pathname 
      : '/';
    throw redirect(`/login?redirect=${encodeURIComponent(redirectTo)}`);
  }
  throw error;
}

