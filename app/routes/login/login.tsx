import { Form, useActionData, useNavigation, useSearchParams, redirect } from "react-router";
import { authAPI, tokenStorage } from "../../services/auth";
import { requireGuest } from "../../utils/auth";

export async function loader() {
  // Redirect if already logged in
  requireGuest();
  return null;
}

export async function action({ request }: { request: Request }) {
  console.log('[LOGIN ACTION] Action called');
  console.log('[LOGIN ACTION] Request URL:', request.url);
  console.log('[LOGIN ACTION] Request method:', request.method);
  
  const formData = await request.formData();
  const usernameOrEmail = formData.get("usernameOrEmail") as string;
  const password = formData.get("password") as string;
  const redirectTo = new URL(request.url).searchParams.get("redirect") || "/front-desk";

  console.log('[LOGIN ACTION] Form data:', {
    hasUsernameOrEmail: !!usernameOrEmail,
    hasPassword: !!password,
    redirectTo,
  });

  if (!usernameOrEmail || !password) {
    console.warn('[LOGIN ACTION] Missing credentials');
    return {
      error: "Username/Email and password are required",
    };
  }

  try {
    console.log('[LOGIN ACTION] Calling authAPI.login...');
    const authResult = await authAPI.login(usernameOrEmail, password);
    console.log('[LOGIN ACTION] Login successful, redirecting to:', redirectTo);
    console.log('[LOGIN ACTION] Auth result:', {
      hasAccessToken: !!authResult.accessToken,
      hasRefreshToken: !!authResult.refreshToken,
    });
    
    // Set cookies in response headers for server-side access
    // Cookies will be available on both server and client
    const redirectUrl = new URL(redirectTo, request.url).toString();
    const response = Response.redirect(redirectUrl, 302);
    
    // Create new headers with cookies
    // Access token: NOT HttpOnly so JavaScript can read it for client-side API calls
    // Refresh token: HttpOnly for security (only used server-side)
    const headers = new Headers(response.headers);
    headers.append('Set-Cookie', `auth_access_token=${encodeURIComponent(authResult.accessToken)}; Path=/; SameSite=Strict; Max-Age=86400`);
    headers.append('Set-Cookie', `auth_refresh_token=${encodeURIComponent(authResult.refreshToken)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800`);
    
    // Create response with cookies
    const responseWithCookies = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers,
    });
    
    console.log('[LOGIN ACTION] Redirect response with cookies created');
    return responseWithCookies;
  } catch (error) {
    console.error('[LOGIN ACTION] Login error caught:', error);
    const errorMessage = error instanceof Error ? error.message : "Login failed. Please try again.";
    console.error('[LOGIN ACTION] Returning error to UI:', errorMessage);
    return {
      error: errorMessage,
    };
  }
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/front-desk";

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <div className="bg-blue-600 text-white rounded-full p-4">
              <svg
                className="h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Hotel PMS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          <input type="hidden" name="redirect" value={redirectTo} />
          
          {actionData?.error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {actionData.error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="usernameOrEmail" className="sr-only">
                Username or Email
              </label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Username or Email"
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              Contact your administrator to create an account
            </p>
          </div>
        </Form>
      </div>
    </div>
  );
}

